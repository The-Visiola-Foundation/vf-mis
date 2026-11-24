# VF MIS

NestJS (TypeScript) backend for the VF MIS platform — student, academic, and programme management with JWT authentication, role-based access, SC (summer camp) dashboards/rollups, and PostgreSQL data storage.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 11 (TypeScript) |
| Language | TypeScript 5.7 |
| Database | PostgreSQL via TypeORM (`DATABASE_URL`) |
| Auth | JWT access + refresh tokens (httpOnly cookies), argon2 hashing, Microsoft Entra ID / MSAL |
| API docs | Swagger / OpenAPI at `/api/docs` |
| Events | `@nestjs/event-emitter` |
| Validation | `class-validator` / `class-transformer` + global `ValidationPipe` |
| Testing | Jest + Supertest |

## Project structure

```
src/
├── main.ts              # Bootstrap: CORS, Swagger, global pipes/interceptors/filters
├── app.module.ts        # Module registry, TypeORM, global guards
├── app.controller.ts    # Health check GET /
├── auth/                # Register/login/refresh/logout/me/reset-password, MSAL, guards, decorators
├── users/               # User entity + service
├── students/            # Student CRUD/batch, combo dedup, entity listeners
├── academics/           # Grades, GPA, performance records
├── programs/            # Program CRUD
├── schools/             # School CRUD + batch + delete-all
├── tracks/              # Track CRUD + batch
├── sc/                  # Summer camp domain: camps, enrolments, measures/results, impact, rollups, compare
├── ascg-profile/        # ASCG profile + listener
├── cbc-profile/         # CBC profile + listener
├── ascg-participation/  # ASCG participation
├── cbc-participation/   # CBC participation
├── sc-participation/    # SC participation
├── stats/               # Read-only overview / reach
├── common/              # Exception filter, transform interceptor, decorators, utils
├── migrations/          # SC schema + seed migrations
└── types/               # Shared TS types
```

## Prerequisites

- Node.js and npm
- A PostgreSQL database (TypeORM connects via `DATABASE_URL`; `synchronize: true` is enabled)
- A `.env` file (see Configuration)

## Configuration

```bash
cp .env.example .env
# edit .env with your DATABASE_URL, JWT secrets, and Microsoft settings
```

Environment variables read by the app (do **not** commit real secrets):

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Runtime environment |
| `PORT` | HTTP port (default `3000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Alternate individual DB settings |
| `FRONTEND_URL` | Frontend origin for CORS/cookies |
| `ACCESS_TOKEN_SECRET` / `ACCESS_TOKEN_EXPIRES_IN` | Access token secret and TTL |
| `REFRESH_TOKEN_SECRET` / `REFRESH_TOKEN_EXPIRES_IN` | Refresh token secret and TTL |
| `SQLITE_DB` | SQLite path (fallback/dev) |
| `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET` | Microsoft Entra ID credentials |
| `MS_SCOPES`, `MS_REDIRECT_URI`, `MS_FRONTEND_URL` | Microsoft OAuth settings |
| `MS_TOKEN_ENCRYPTION_KEY` | Key for encrypting Microsoft tokens |

`.env.example` only contains a sample `SQLITE_DB`; add the remaining variables yourself. `.env` is gitignored.

## Getting started

```bash
npm install
cp .env.example .env
npm run start:dev
```

- Health check: `curl http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`

## Available scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` / `start:dev` / `start:prod` | Start / watch / production |
| `npm run start:debug` | Debug watch mode |
| `npm run lint` | ESLint with autofix |
| `npm run format` | Prettier format for `src/` and `test/` |
| `npm run test` / `test:e2e` / `test:cov` | Unit / e2e / coverage tests |

Tests (`*.spec.ts`) live under `src/` and run with Jest + `ts-jest`.

## Authentication & authorization

Endpoints: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `POST /auth/reset-password`. Access + refresh tokens are set as httpOnly cookies.

Roles: `ADMIN`, `KEY_STAFF`, `PROGRAMME_STAFF`, `BOARD`. A global `AccessTokenGuard` permits `GET / HEAD / OPTIONS` without a token and requires a valid JWT for writes; `RolesGuard` enforces `@Roles(...)` where present. `@Public()` bypasses the JWT guard; `@WriteProtected()` is a Swagger bearer marker (real enforcement comes from the global guard).

Responses are wrapped as `{ statusCode, data }`; errors as `{ statusCode, message }`.

## Main domains

- **Students** (`/students`) — CRUD + batch; auto-creates participation/profile records via entity listeners.
- **Academics** (`/academics`) — grade, GPA, performance records (individual + batch).
- **Programs / Schools / Tracks** — standard CRUD; schools also support category filter and delete-all.
- **SC** (`/sc`) — camps, participants, enrolments, measures & results, impact dashboard, year rollup, core-measure compare.
- **Stats** (`/stats`) — read-only `overview` and `reach`.
- **Profiles / Participation** — ASCG and CBC profiles and participation records.

## Database

TypeORM connects to PostgreSQL via `DATABASE_URL` with `autoLoadEntities` and `synchronize: true`. Explicit migrations exist under `src/migrations/` (SC tables, views, 2026 seed data). Raw SQL and TypeORM migration styles are both present — review before running against production.

## Contributing

1. Create a feature branch from `main`.
2. Run `npm run lint` and `npm run format`; ensure `npm test` passes.
3. Add/update `*.spec.ts` tests for changes.
4. Open a pull request describing the change and any env/migration updates.

## License

UNLICENSED (private project). See `package.json`.
