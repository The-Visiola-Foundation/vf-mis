# BACKEND_BREAKDOWN.md

Factual breakdown of the VF MIS NestJS backend architecture, APIs, data model,
authorization, business rules, risks, and safe sizing queries.

**Scope:** Read-only documentation. No secrets, no real personal data, no
production data references.

---

## 1. Overview

| Item | Detail |
|------|--------|
| Framework | NestJS (TypeScript) |
| Language | TypeScript |
| Database | PostgreSQL via TypeORM (`type: 'postgres'`) |
| Connection | `CONNECTION_STRING` env var, `TypeOrmModule.forRootAsync` |
| Synchronization | `synchronize: true` (TypeORM auto-schema) + explicit SQL/TypeORM migrations under `src/migrations/` |
| Event bus | `@nestjs/event-emitter` (`EventEmitterModule.forRoot()`) |
| Auth | JWT access + refresh tokens in httpOnly cookies; `ACCESS_TOKEN_SECRET` |
| API docs | Swagger/OpenAPI at `/api/docs` |
| Global guard | `AccessTokenGuard` (registered as `APP_GUARD` in `AppModule`) |
| Base port | `process.env.PORT ?? 3000` |
| Body limits | JSON & urlencoded `50mb` |
| CORS | `http://localhost:3000`, `http://localhost:5173` |

### Global request/response handling

* **`TransformInterceptor`** (`src/common/transform.interceptor.ts`) — wraps every successful response as `{ statusCode, data }`.
* **`HttpExceptionFilter`** (`src/common/exception.filter.ts`) — catches all exceptions; maps DB connection errors to `503`, TypeORM `QueryFailedError` codes `23505`/`SQLITE_CONSTRAINT_UNIQUE` → `409`, `23503`/`23502` → `400`, `TypeError` → `500`, other → `500`.
* **Global `ValidationPipe`** — `whitelist: true`, `forbidNonWhitelisted: false`, `transform: true`.
## 2. Modules and Controllers

| Module | Controller | Base route | Notes |
|--------|-----------|------------|-------|
| `AuthModule` | `AuthController` | `/auth` | Public register/login/refresh/reset; protected logout/me |
| `UsersModule` | `UsersController` | `/users` | Skeleton controller (no route methods defined) |
| `StudentsModule` | `StudentsController` | `/students` | CRUD + batch; writes `@WriteProtected()` |
| `AcademicsModule` | `AcademicsController` | `/academics` | Individual + batch grade/GPA/performance; all writes protected |
| `ProgramsModule` | `ProgramsController` | `/programs` | CRUD; writes protected |
| `SchoolsModule` | `SchoolsController` | `/schools` | CRUD + batch + delete-all; writes protected |
| `TracksModule` | `TracksController` | `/tracks` | CRUD + batch; writes protected |
| `ScModule` | `ScController` | `/sc` | Camp CRUD, results upsert, impact dashboard, rollups, compare |
| `AscgProfileModule` | `AscgProfileController` | `/ascg-profile` | CRUD; writes protected |
| `CbcProfileModule` | `CbcProfileController` | `/cbc-profile` | CRUD; writes protected |
| `AscgParticipationModule` | `AscgParticipationController` | `/ascg-participation` | CRUD; writes protected |
| `CbcParticipationModule` | `CbcParticipationController` | `/cbc-participation` | CRUD; writes protected |
| `ScParticipationModule` | `ScParticipationController` | `/sc-participation` | CRUD; writes protected |
| `ProgramParticipationModule` | `ProgramParticipationController` | `/program-participation` | CRUD; writes protected |
| `StatsModule` | `StatsController` | `/stats` | `overview`, `reach` (read-only) |
| (root) | `AppController` | `/` | Health `GET /` |

### Authorization annotation conventions

* `@Public()` — bypasses JWT guard entirely (register, login, refresh, reset-password).
* `@WriteProtected()` — adds `ApiBearerAuth` Swagger marker only; actual enforcement comes from the global `AccessTokenGuard` (all non-GET methods require a valid JWT; GET/HEAD/OPTIONS are allowed without one).
* `@Roles(...roles)` — enforced by `RolesGuard`; used on SC write routes and SC read rollups/compare. Absent metadata = allow.
* `AccessTokenGuard` logic: if `@Public()` **or** method is `GET/HEAD/OPTIONS` → allow. Otherwise require `Authorization: Bearer <token>`, verify against `ACCESS_TOKEN_SECRET`, attach payload to `request.user`.

### Role model (`src/common/user-role.enum.ts`)

```
ADMIN        = 'admin'
KEY_STAFF    = 'key_staff'
PROGRAMME_STAFF = 'programme_staff'
BOARD        = 'board'
```

Roles guard fallback: when the JWT payload has no `role`, it defaults to `PROGRAMME_STAFF` (backwards-compatible behaviour).

### SC controller role groups

```ts
const STAFF = [ADMIN, KEY_STAFF, PROGRAMME_STAFF];
const STAFF_AND_BOARD = [ADMIN, KEY_STAFF, PROGRAMME_STAFF, BOARD];
```

| SC endpoint | Method | Roles | Protection |
|-------------|--------|-------|------------|
| `GET /sc/camps` | GET | — | Public-readable (GET) |
| `GET /sc/years/:year/rollup` | GET | STAFF_AND_BOARD | JWT + RolesGuard |
| `GET /sc/compare?core=` | GET | STAFF_AND_BOARD | JWT + RolesGuard |
| `GET /sc/camps/:campId/impact` | GET | — | Public-readable (GET) |
| `POST /sc/camps` | POST | STAFF | `@WriteProtected()` + JWT + RolesGuard |
| `PUT /sc/camps/:campId/results` | PUT | STAFF | `@WriteProtected()` + JWT + RolesGuard |
| `POST /sc/camps/:campId/import` | POST | STAFF | `@WriteProtected()` + JWT + RolesGuard (returns `501 NOT IMPLEMENTED`) |

## 3. Authentication

### Flow
1. `POST /auth/register` (public) — `RegisterDto` {name, email, password(min 8)} → creates `User`, returns `AuthResult` (access + refresh tokens set as httpOnly cookies).
2. `POST /auth/login` (public) — `LoginDto` → verifies credentials, issues tokens.
3. `POST /auth/refresh` (public) — `RefreshTokenDto` → issues new access token.
4. `POST /auth/logout` (guarded) — clears refresh token hash.
5. `GET /auth/me` (guarded) — returns `SafeUser` (id, name, email, role, microsoftId, avatarUrl; password/hash excluded).
6. `POST /auth/reset-password` (public) — `ResetPasswordDto` → token-based reset.

### Cookie settings
* `access_token`: httpOnly, sameSite=none, secure in production, maxAge 15 min.
* `refresh`: httpOnly, sameSite=none, secure in production, maxAge 7 days.

### JWT payload (`JwtPayload`)
```ts
{ sub: string; email: string; role?: string }
```
`sub` = user `id` (UUID).

### User entity (`src/users/entities/user.entity.ts`)
* `id` — UUID PK (`PrimaryGeneratedColumn('uuid')`)
* `name` — varchar(255), not null
* `email` — varchar(255), **unique**, not null
* `role` — varchar(32), default `programme_staff`, not null
* `microsoftId` — varchar(255), unique, nullable
* `avatarUrl` — varchar(512), nullable
* `passwordHash` — varchar(255), nullable (stored hash)
* `refreshTokenHash` — varchar(255), nullable
* `passwordResetTokenHash` — varchar(255), nullable
* `passwordResetTokenExpiresAt` — date, nullable
* `createdAt`, `updatedAt` — date columns

### Auth-related risks
* Passwords handled as hashes only; plaintext never persisted.
* Refresh tokens and reset tokens stored as hashes.
* Global guard makes GET endpoints publicly readable by default — confirm this is intended for all data domains.
* `@WriteProtected()` is purely a Swagger decorator; real enforcement is the global guard + `RolesGuard`.

## 4. Data model

### 4.1 Core identity & program data

#### `User` (`user` table)
See section 3.2.

#### `Student` (`students` table)
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | uuid | PK (`PrimaryGeneratedColumn('uuid')`) | |
| `firstName` | varchar | not null | |
| `lastName` | varchar | not null | |
| `email` | varchar | nullable, not unique | |
| `phone` | varchar | nullable | |
| `dateOfBirth` | date | not null | |
| `address` | varchar | nullable | |
| `country` | varchar | not null | |
| `yearJoined` | int | not null | |
| `consent` | boolean | default false | |
| `combo` | varchar | **unique** (via `@Unique(['combo'])`) | Auto-computed `firstname-lastname-dob` (lowercased, sorted) in `@BeforeInsert`/`@BeforeUpdate` |
| Relations | `ascgProfile`, `cbcProfile`, `ascgParticipation[]`, `cbcParticipation[]`, `scParticipation[]`, `programParticipation[]` | — | OneToOne / OneToMany |

**Duplicate handling:** `combo` unique constraint prevents duplicate student identity (name + DOB). Entity listeners handle related-record creation (see section 4.4).

#### `Program` (`programs` table)
| Field | Type | Notes |
|-------|------|-------|
| `id` | — | Set explicitly from DTO (`program.id = createProgramDto.id`) |

#### `School` (`schools` table)
Service supports `create`, `createMany`, `findAll(category?)`, `findOne`, `update`, `remove`, `removeAll` (`clear()`). Controller exposes all; writes are `@WriteProtected()`.

#### `Track` (`tracks` table)
Standard CRUD + batch create; writes protected.

### 4.2 Participation & profile entities (student sub-domains)

| Entity | Table | Program gate | Auto-created on student create? |
|--------|-------|--------------|---------------------------------|
| `ProgramParticipation` | `program_participation` | — | Yes (all students) |
| `AscgParticipation` | `ascg_participation` | `programId !== 'cbc'` | Yes (`ASCG_STUDENT_CREATED`) |
| `CbcParticipation` | `cbc_participation` | `programId === 'cbc'` | Yes (`CBC_STUDENT_CREATED`) |
| `ScParticipation` | `sc_participation` | — | Yes (`SC_STUDENT_CREATED`) |
| `AscgProfile` | `ascg_profile` | `programId !== 'cbc'` | Yes (`AscgProfileListener`) |
| `CbcProfile` | `cbc_profile` | `programId === 'cbc'` | Yes (`CbcProfileListener`) |

All listeners catch unique-constraint errors (`SQLITE_CONSTRAINT_UNIQUE`, `23505`, `UNIQUE constraint failed`) and silently return — idempotent on re-creation.

#### `CreateStudentDto` (`src/students/dto/create-student.dto.ts`)
Uses `IntersectionType` of `CreateAscgProfileDto`, `CreateCbcProfileDto`, `CreateAscgParticipationDto`, `CreateScParticipationDto`, `CreateCbcParticipationDto` plus: `firstName`, `lastName` (`@ProperNoun()`), `dateOfBirth` (`@IsDateString`), `email?`, `phone?`, `address?`, `country` (`@ProperNoun()`), `yearJoined` (`@IsNumber`), `programId?`.

`@ProperNoun()` decorator (`src/common/decorators/proper.decorator.ts`) — trims, lowercases, title-cases each word.

`UpdateStudentDto` = `PartialType(CreateStudentDto)`.

### 4.3 SC domain entities (all under `src/sc/entities/`, table prefix `sc_`)

| Entity | Table | PK | Key relationships |
|--------|-------|-----|-------------------|
| `ScCamp` | `sc_camp` | `campId` varchar(16) | `@Unique(['type','campYear'])`, `@Index(campYear)` |
| `ScParticipant` | `sc_participant` | `participantId` identity | `studentId` uuid → `Student` (SET NULL), `@Index(studentId)` |
| `ScEnrolment` | `sc_enrolment` | (`campId`, `participantId`) composite | `camp` → `ScCamp` (CASCADE), `participant` → `ScParticipant` (CASCADE), `classLevelId` → `ScClassLevel` (SET NULL), `trackId` → `ScAcademicTrack` (SET NULL); `@Index(campId)`, `@Index(participantId)` |
| `ScMeasure` | `sc_measure` | `measureId` identity | `camp` → `ScCamp` (CASCADE); `@Unique(['campId','coreCode'])`, `@Index(campId)` |
| `ScMeasureResult` | `sc_measure_result` | (`campId`, `measureId`) composite | `camp` → `ScCamp` (CASCADE), `measure` → `ScMeasure` (CASCADE); `@Index(campId)` |
| `ScScore` | `sc_score` | (`participantId`, `measureId`, `pointNo`) composite | `participant` → `ScParticipant` (CASCADE), `measure` → `ScMeasure` (CASCADE); `@Index(measureId)`, `@Index(participantId)` |
| `ScAttendance` | `sc_attendance` | (`campId`, `dayNumber`) composite | `camp` → `ScCamp` (CASCADE) |
| `ScAssessmentSummary` | `sc_assessment_summary` | `campId` (OneToOne) | `camp` → `ScCamp` (CASCADE) |
| `ScAward` | `sc_award` | (`campId`, `category`) composite | `camp` → `ScCamp` (CASCADE), `participantId` → `ScParticipant` (SET NULL); `@Index(campId)` |
| `ScExpense` | `sc_expense` | — | Linked to camp |
| `ScFeedbackItem` | `sc_feedback_item` | (`campId`, `itemCode`) composite | `camp` → `ScCamp` |
| `ScFeedbackSummary` | `sc_feedback_summary` | `campId` (OneToOne) | `camp` → `ScCamp` (CASCADE) |
| `ScInterestArea` | `sc_interest_area` | (`campId`, `areaName`) composite | `camp` → `ScCamp` |
| `ScImprovementTheme` | `sc_improvement_theme` | (`campId`, `theme`) composite | `camp` → `ScCamp` |
| `ScActivityVote` | `sc_activity_vote` | (`campId`, `activity`) composite | `camp` → `ScCamp` (CASCADE) |
| `ScProject` | `sc_project` | (`campId`, `teamNumber`) composite | `camp` → `ScCamp` (CASCADE); `technologies` is `text[]` |
| `ScJudgingScore` | `sc_judging_score` | (`campId`, `teamNumber`, `criterion`) composite | `camp` → `ScCamp` (CASCADE) |
| `ScPartnerEngagement` | `sc_partner_engagement` | — | Linked to camp |
| `ScRecommendation` | `sc_recommendation` | `id` identity | `camp` → `ScCamp` (CASCADE); `@Index(campId)` |
| `ScRatingDist` | `sc_rating_dist` | (`campId`, `rating`) composite | `camp` → `ScCamp` (CASCADE) |
| `ScClassLevel` | `sc_class_level` | `id` identity | Referenced by enrolment |
| `ScAcademicTrack` | `sc_academic_track` | `trackId` identity | `@Unique(['name'])`; referenced by enrolment |
| `ScObsPoint` | `sc_obs_point` | — | Observation points |

`ScInstrument` enum: `SELF_EFFICACY`, `OBSERVATION`, `KNOWLEDGE`, `FEEDBACK`.

#### Numeric storage (`src/common/transformers/numeric.transformer.ts`)
`ColumnNumericTransformer` — Postgres `numeric`/`decimal` comes back as string; transformer exposes numbers to API, stores as numeric. Unknown values → `null`, never `0`.

### 4.4 Entity listeners & automation

| Listener | Event | Action |
|----------|-------|--------|
| `AscgProfileListener` | `student.created` | If `programId !== 'cbc'`, create `AscgProfile` from event; swallow unique violations |
| `CbcProfileListener` | `student.created` | If `programId === 'cbc'`, create `CbcProfile`; swallow unique violations |
| `ProgramParticipationListener` | `student.created` | Create `ProgramParticipation` |
| `ProgramParticipationListener` | `ascg.student.created` | Create `AscgParticipation` |
| `ProgramParticipationListener` | `cbc.student.created` | Create `CbcParticipation` |
| `ProgramParticipationListener` | `sc.student.created` | Create `ScParticipation` |

All listeners swallow `QueryFailedError` unique-constraint violations (idempotent re-runs) and re-throw other errors.

### 4.5 ID generation & uniqueness summary

| Domain | ID strategy |
|--------|-------------|
| `User` | UUID (`PrimaryGeneratedColumn('uuid')`) |
| `Student` | UUID (`PrimaryGeneratedColumn('uuid')`) |
| `Program` | Client-supplied ID string |
| `School` | — |
| `Track` | identity |
| `ScCamp` | client-supplied `campId` varchar(16), e.g. `2026-SUMMER` |
| `ScParticipant` | identity integer |
| `ScMeasure` | identity integer |
| Most SC rollup/result tables | composite PK (`campId` + natural key) |
| `ScRecommendation` | identity integer |

Unique constraints:
* `User.email` unique
* `Student.combo` unique (auto-computed)
* `ScCamp` (`type`, `campYear`) unique
* `ScMeasure` (`campId`, `coreCode`) unique
* `ScAcademicTrack.name` unique

## 5. SC business rules & rollup formulas

### 5.1 Rollup utilities (`src/sc/utils/rollup.util.ts`)

Documented rules:
1. Sum counts and spend.
2. Count unique participants **once across camps**.
3. Recompute means from **pooled raw counts weighted by n** — never average two camps' means or percentages; never combine p-values.
4. Unknown values are `null`, never `0`.
5. Year roll-ups use **core measures only** (`isCore && coreCode`).

```ts
pooledMean(inputs: { mean: number|null; n: number|null }[]): number|null
  // weighted by n; skips null/n<=0; returns null if denominator <= 0

sumCounts(values: (number|null|undefined)[]): number|null
  // returns null if no non-null values

pctFromCounts(part, whole): number|null
  // (part / whole) * 100; null when denominator missing/zero
```

### 5.2 `ScRollupService.getYearRollup(year)`
* Finds camps for the year, ordered by `campId`.
* Collects enrolments, expenses, measures, results for those campIds.
* `uniqueParticipants` = distinct `participantId` across enrolments.
* `participations` = total enrolment rows.
* `totalSpend` = sum of expense amounts (null if any amount unknown).
* `costPerParticipant` = spend / uniqueParticipants (only when spend known and participants > 0).
* `coreCompare` = for each core code, per-camp `{n, meanA, meanB, change, pValue, significant}` plus `pooledMeanB`, `pooledN`, `pValue: null`.

### 5.3 `ScRollupService.getCompare(coreCode)`
* Finds all measures with that `coreCode` (with camp relation).
* For each camp: result fields `n, meanA, meanB, change, pValue, significant, improvedN, declinedN, sameN`.

### 5.4 `ScService.getImpact(campId)` — dashboard payload
Returns one object per camp with sections:
* `camp`, `enrolments` (per-day attendance), `selfEfficacy`, `assessment`, `observation` (points + measures), `feedback` (invited/responses/meanSatisfaction/pct4Or5/invalidN/ratingDist/items/interestAreas/activities/improvements), `projects` (with per-team judging scores), `awards`, `partners`, `expenses` (total, currency, costPerParticipant), `recommendations`.

`pct4Or5` = `pctFromCounts(rated45, ratingTotal)`.

### 5.5 `ScResultsService.bulkUpsertResults` — validation rules
* Camp must exist.
* Duplicate `core_code` within a single payload → `400`.
* `core_code` already existing in camp with a different `measureId` → `400`.
* `scaleMin > scaleMax` → `400`.
* `pValue` must be in [0, 1] → `400`.
* `meanA`/`meanB` must be within `[scaleMin, scaleMax]` when both scale bounds set → `400`.
* `change = meanB - meanA` when both means present, else null.
* Each result must match a measure via `measureId` or `coreCode` → `400`.
* Runs inside a `DataSource` transaction.

### 5.6 Migrations (`src/migrations/`)
| File | Purpose |
|------|---------|
| `1760966400000-ScTables.ts` | SC core tables |
| `1760966500000-ScCoreTables.ts` | Additional SC core tables |
| `1760966600000-ScViews.ts` | SC views |
| `1760966700000-ScSeed2026Summer.ts` | Seed 2026 Summer |
| `1760966800000-ScSeed2026Results.ts` | Seed 2026 results |
| `1760966900000-ScSeed2026Extras.ts` | Seed 2026 extras |

Both raw SQL and TypeORM migration definitions are present.

## 6. Endpoint reference

### 6.1 Auth (`/auth`)
| Method | Path | Guard | Body | Summary |
|--------|------|-------|------|---------|
| POST | `/register` | `@Public()` | `RegisterDto` | Register user |
| POST | `/login` | `@Public()` | `LoginDto` | Log in |
| POST | `/refresh` | `@Public()` | `RefreshTokenDto` | Refresh access token |
| POST | `/logout` | `AccessTokenGuard` | — | Log out (clears refresh hash) |
| GET | `/me` | `AccessTokenGuard` | — | Current user profile (`SafeUser`) |
| POST | `/reset-password` | `@Public()` | `ResetPasswordDto` | Password reset |

### 6.2 Students (`/students`)
| Method | Path | Guard | Summary |
|--------|------|-------|---------|
| POST | `/` | `@WriteProtected()` | Create student (triggers listeners) |
| POST | `/batch` | `@WriteProtected()` | Create multiple students |
| GET | `/` | (none, GET) | List with `name`/`firstName`/`lastName` filters |
| DELETE | `/` | `@WriteProtected()` | Delete all |
| GET | `/:id` | (none, GET) | Get one |
| PATCH | `/:id` | `@WriteProtected()` | Update |
| DELETE | `/:id` | `@WriteProtected()` | Delete |

### 6.3 Academics (`/academics`)
All write endpoints `@WriteProtected()`.
| Method | Path | Summary |
|--------|------|---------|
| POST | `/batch` | Create batch of academic records |
| POST | `/record` | Create single academics record |
| PATCH | `/record/:id` | Update academics record |
| DELETE | `/record/:id` | Delete academics record |
| POST | `/grade` | Create grade record |
| PATCH | `/grade/:id` | Update grade record |
| DELETE | `/grade/:id` | Delete grade record |
| POST | `/performance` | Create performance record |
| PATCH | `/performance/:id` | Update performance record |
| DELETE | `/performance/:id` | Delete performance record |
| POST | `/gpa` | Create GPA record |
| PATCH | `/gpa/:id` | Update GPA record |
| DELETE | `/gpa/:id` | Delete GPA record |
| GET | `/by-year?year=` | Fetch academic records by year |
| GET | `/summary?year=` | Fetch academic summary by year (delegates to `findByYear`) |

Supports individual and batch grade, GPA, and performance updates.

### 6.4 Programs / Schools / Tracks
Standard REST (`/programs`, `/schools`, `/tracks`): POST (create/batch), GET (list/one), PATCH, DELETE. All writes `@WriteProtected()`. Schools also support `DELETE /` (delete all) and `findAll(category)`.

### 6.5 Participation & Profiles
Standard CRUD on `/ascg-participation`, `/cbc-participation`, `/sc-participation`, `/program-participation`, `/ascg-profile`, `/cbc-profile`. All writes `@WriteProtected()`.

### 6.6 SC (`/sc`)
| Method | Path | Roles | Protection |
|--------|------|-------|------------|
| GET | `/sc/camps` | — | Public-readable (GET) |
| GET | `/sc/years/:year/rollup` | STAFF_AND_BOARD | JWT + RolesGuard |
| GET | `/sc/compare?core=` | STAFF_AND_BOARD | JWT + RolesGuard |
| GET | `/sc/camps/:campId/impact` | — | Public-readable (GET) |
| POST | `/sc/camps` | STAFF | `@WriteProtected()` + JWT + RolesGuard |
| PUT | `/sc/camps/:campId/results` | STAFF | `@WriteProtected()` + JWT + RolesGuard |
| POST | `/sc/camps/:campId/import` | STAFF | `@WriteProtected()` + JWT + RolesGuard (returns `501 NOT IMPLEMENTED`) |

`STAFF = [ADMIN, KEY_STAFF, PROGRAMME_STAFF]`
`STAFF_AND_BOARD = [ADMIN, KEY_STAFF, PROGRAMME_STAFF, BOARD]`

### 6.7 Stats (`/stats`)
* `GET /stats/overview` — overview
* `GET /stats/reach` — reach

Both read-only, no guard metadata (GET allowed by global guard).

### 6.8 Response shape
Every successful response is wrapped by `TransformInterceptor`:
```json
{ "statusCode": 200, "data": <payload> }
```
Error responses from `HttpExceptionFilter`:
```json
{ "statusCode": 400|409|500|503, "message": "..." }
```

### 6.9 Pagination & filtering
* No built-in pagination (no `limit`/`offset` query params on list endpoints).
* `SchoolsController.findAll` supports optional `category` filter → `findAndCount({ where: { category } })` (returns `[data, count]` tuple but controller does not shape it for pagination).
* `StudentsController.findAll` supports `name`/`firstName`/`lastName` query filters.
* SC rollup/compare are year/core scoped, not paginated.

## 7. Risks

### 7.1 Validation & data-quality risks
| Risk | Detail | Location |
|------|--------|----------|
| `combo` duplicate students | `combo` is auto-computed from sorted lowercase names + DOB; two students with same names and same DOB collide | `Student.setCombo()` |
| `combo` stale on name/DOB change | `@BeforeUpdate` recomputes, but changing names could create a conflict with an existing student | `Student.setCombo()` |
| No pagination | List endpoints return all rows; large tables could cause memory/response issues | All `findAll` controllers |
| No `limit` on SC impact payload | `getImpact` loads all related collections for a camp | `ScService.getImpact` |
| Silent unique-constraint swallowing | Listeners return on unique violations without logging which record was skipped | All `*Listener` classes |
| `Program.id` client-supplied | Caller sets `program.id = createProgramDto.id` — risk of client-chosen IDs/collisions | `ProgramsService.create` |
| `SchoolsService.update/remove` return stub strings | `update` returns `` `This action updates a #${id} school` ``, `remove` similar — not implemented | `SchoolsService` |
| `AcademicsController.deleteGPA` calls `delelePerformance` | Typo: deletes a performance record instead of GPA | `AcademicsController.deleteGPA` |
| Numeric transformer NaN → null | Non-numeric strings become null silently | `ColumnNumericTransformer` |

### 7.2 Security risks
| Risk | Detail |
|------|--------|
| Global guard allows all GETs without auth | `AccessTokenGuard` permits `GET/HEAD/OPTIONS` without JWT — all read endpoints are publicly readable |
| `@WriteProtected()` is Swagger-only | Does not enforce anything by itself; real enforcement is the global guard + `RolesGuard` |
| Roles fallback to `PROGRAMME_STAFF` | Missing `role` in JWT defaults to `programme_staff` — may over-privilege users with malformed tokens |
| CORS allows two localhost origins only | Fine for dev; needs review for production frontends |
| Cookie `sameSite: 'none'` + `secure` | Requires HTTPS in production; cross-site cookie exposure |
| Password min length 8 only | No complexity requirements |
| `removeAll`/`clear()` on schools and students | Mass-delete endpoints exposed under write protection |

### 7.3 Privacy & minor-data risks
| Risk | Detail |
|------|--------|
| Student PII collected | `firstName`, `lastName`, `dateOfBirth`, `email`, `phone`, `address`, `country`, family details (father/mother names, phones, education, siblings), career choices |
| `consent` flag | Boolean on Student; no enforcement that reads/writes respect consent |
| `combo` is derived PII | `firstname-lastname-dob` stable identifier — unique constraint could enable linkage attacks |
| SC participant data | `firstName`, `lastName`, `dob`, linked to `studentId` — connects camp data to student identity |
| No data retention or deletion by consent | `deleteAll`/`remove` exist but no consent-based erasure workflow |
| Audit log absent | No record of who read or modified student/SC records |

### 7.4 Maintainability risks
| Risk | Detail |
|------|--------|
| `synchronize: true` | TypeORM auto-schema can drift from migrations; risky in production |
| Mixed migration styles | Raw SQL + TypeORM migrations under `src/migrations/` |
| Stub service methods | `SchoolsService.update/remove`, `UsersController` empty |
| Large `CreateStudentDto` intersection | Combines 5 DTOs — hard to validate which fields apply to which program |
| `as any` casts | Used in listeners and controllers (`createParticipation(event as any)`, `editAcademics(... as any)`) |
| Console logs in services | `console.log(user)` in `UsersService.createUser`, `console.debug` in listener |
| No OpenAPI on some controllers | `UsersController` has no methods; `StatsController` lacks `@ApiTags`/`@ApiOperation` |

### 7.5 Data-quality risks
| Risk | Detail |
|------|--------|
| Email not unique on Student | Multiple students can share an email |
| Phone/address optional and unvalidated | No format validation |
| `ScMeasureResult.change` computed | `change = meanB - meanA` computed at save time; if `meanA`/`meanB` later updated, `change` is stale |
| Null vs 0 semantics | Numeric transformer maps unknown to null; code must distinguish "measured zero" from "unknown" |
| `@Unique` only on `combo` for students | No uniqueness on email; potential duplicate identities |

## 8. Safe read-only sizing & counting queries

**Important:** These are **inspection/count-only** queries. They perform no writes, no deletes, and no schema changes. **Do not run against production data** unless you have confirmed the connection string points to a non-production replica and you understand the lock/performance impact of `COUNT(*)` on large tables.

```sql
-- 1. Overall table row counts
SELECT
  'users'               AS table_name, COUNT(*) AS row_count FROM "user"
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'sc_camp',      COUNT(*) FROM sc_camp
UNION ALL
SELECT 'sc_participant', COUNT(*) FROM sc_participant
UNION ALL
SELECT 'sc_enrolment', COUNT(*) FROM sc_enrolment
UNION ALL
SELECT 'sc_measure',   COUNT(*) FROM sc_measure
UNION ALL
SELECT 'sc_measure_result', COUNT(*) FROM sc_measure_result
UNION ALL
SELECT 'sc_score',     COUNT(*) FROM sc_score
UNION ALL
SELECT 'sc_attendance', COUNT(*) FROM sc_attendance
UNION ALL
SELECT 'sc_award',     COUNT(*) FROM sc_award
UNION ALL
SELECT 'sc_expense',   COUNT(*) FROM sc_expense
UNION ALL
SELECT 'sc_project',   COUNT(*) FROM sc_project
UNION ALL
SELECT 'sc_recommendation', COUNT(*) FROM sc_recommendation;

-- 2. Students per program
SELECT programId, COUNT(*) AS student_count
FROM program_participation
GROUP BY programId
ORDER BY student_count DESC;

-- 3. Camps per year
SELECT campYear, COUNT(*) AS camp_count
FROM sc_camp
GROUP BY campYear
ORDER BY campYear;

-- 4. Enrolments per camp
SELECT campId, COUNT(*) AS enrolment_count
FROM sc_enrolment
GROUP BY campId
ORDER BY enrolment_count DESC
LIMIT 20;

-- 5. Unique participants across all camps (SC domain)
SELECT COUNT(DISTINCT participantId) AS unique_participants
FROM sc_enrolment;

-- 6. Measures per camp (core vs non-core)
SELECT campId,
       COUNT(*) AS total_measures,
       COUNT(*) FILTER (WHERE isCore) AS core_measures
FROM sc_measure
GROUP BY campId
ORDER BY total_measures DESC;

-- 7. Results completeness per camp
SELECT m.campId,
       COUNT(m.measureId) AS measures_with_results
FROM sc_measure m
JOIN sc_measure_result r ON r.campId = m.campId AND r.measureId = m.measureId
GROUP BY m.campId;

-- 8. Spend per camp (where expense rows exist)
SELECT campId,
       COUNT(*) AS expense_lines,
       SUM(amount) AS total_spend,
       MIN(amount) IS NOT NULL AND MAX(amount) IS NOT NULL AS spend_fully_known
FROM sc_expense
GROUP BY campId;

-- 9. Student duplicates by combo (should be zero)
SELECT combo, COUNT(*) AS dup_count
FROM students
GROUP BY combo
HAVING COUNT(*) > 1;

-- 10. Users by role
SELECT role, COUNT(*) AS user_count
FROM "user"
GROUP BY role;
```

**Safety guidance:**
* Prefer `COUNT(*)` over `SELECT *` for sizing.
* Add `LIMIT` when inspecting sample rows.
* Avoid `ORDER BY` on unindexed large columns without `LIMIT`.
* Run on a read replica or during off-peak hours.
* Do not combine with `DELETE`, `UPDATE`, `TRUNCATE`, or `DROP`.

## 9. Authorization summary matrix

| Domain | Read (GET) | Write (POST/PATCH/DELETE) | Role restriction on write |
|--------|-----------|---------------------------|---------------------------|
| Auth | Public | Public (register/login) | — |
| Auth (me/logout) | JWT | JWT | — |
| Users | — | — | Controller empty |
| Students | Public (GET) | JWT | Any authenticated role |
| Academics | Public (GET) | JWT | Any authenticated role |
| Programs | Public (GET) | JWT | Any authenticated role |
| Schools | Public (GET) | JWT | Any authenticated role |
| Tracks | Public (GET) | JWT | Any authenticated role |
| Participation/Profiles | Public (GET) | JWT | Any authenticated role |
| SC camps | Public (GET) | JWT | `STAFF` (admin/key_staff/programme_staff) |
| SC results upsert | — | JWT | `STAFF` |
| SC rollup/compare | JWT | — | `STAFF_AND_BOARD` (+ board) |
| SC impact | Public (GET) | — | — |
| Stats | Public (GET) | — | — |

`STAFF = [ADMIN, KEY_STAFF, PROGRAMME_STAFF]`
`STAFF_AND_BOARD = [ADMIN, KEY_STAFF, PROGRAMME_STAFF, BOARD]`

## 10. Key files reference

| File | Purpose |
|------|---------|
| `src/main.ts` | Bootstrap, CORS, Swagger, global pipes/interceptors/filters |
| `src/app.module.ts` | Module registry, global `AccessTokenGuard`, TypeORM config |
| `src/auth/guards/access-token.guard.ts` | Global JWT guard |
| `src/auth/guards/roles.guard.ts` | `@Roles()` enforcement |
| `src/auth/decorators/public.decorator.ts` | `@Public()` |
| `src/auth/decorators/write-protected.decorator.ts` | `@WriteProtected()` (Swagger marker) |
| `src/auth/decorators/roles.decorator.ts` | `@Roles()` |
| `src/common/exception.filter.ts` | Global exception → HTTP mapping |
| `src/common/transform.interceptor.ts` | `{ statusCode, data }` response wrapper |
| `src/common/transformers/numeric.transformer.ts` | numeric↔string transformer |
| `src/common/user-role.enum.ts` | Role enum |
| `src/common/decorators/proper.decorator.ts` | `@ProperNoun()` |
| `src/common/utils/rollup.util.ts` | pooledMean, sumCounts, pctFromCounts |
| `src/students/entities/student.entity.ts` | Student + `combo` dedup logic |
| `src/users/entities/user.entity.ts` | User + token fields |
| `src/migrations/*.ts` | SC schema + seed migrations |
| `src/sc/sc-rollup.service.ts` | Year rollup + compare |
| `src/sc/sc-results.service.ts` | Bulk upsert with validation |
| `src/sc/sc.service.ts` | Camp impact dashboard payload |
| `src/students/events/student.events.ts` | Event constants |
| `src/*/*.listener.ts` | Entity auto-creation listeners |

---

*Document generated from source-code review. Verify against the running API (`/api/docs`) and the actual database schema before relying on this for operational decisions.*
