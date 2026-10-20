# VF-MIS Frontend Implementation Plan — Viewer + Admin (Vite + React SPA)

> Approved plan. 2 developers. Last updated: 2026-10-13.

## 0. Locked decisions

1. **Local development only** — no production frontend URLs yet.
   - API: `http://localhost:3000`
   - Viewer: `http://localhost:5173`
   - Admin: `http://localhost:5174`
2. **Auth: password-only + mandatory TOTP 2FA** (authenticator app). No OAuth for v1.
3. **Real permissions.** Viewer roles + separate `admin` role.
4. **Student `combo` dedupe deferred.**
5. **CBC / Programme 3 / cost-per-outcome data deferred.**
6. **Accounts: admin creates all accounts.** No self-register.
7. **Board: Board page only.** Programme staff deferred.

## 1. Current state (verified in repo)

### `frontend/` — contracts only, no app
- `frontend/dtos.ts` (422 lines): enums + DTOs + `*Record` types.
- `frontend/controller-types.ts` (261 lines): typed responses map.
- No `package.json`, no Vite app, no components.

### Backend — NestJS + Postgres, 15 prefixes
```
GET  /                                    health
POST /auth/register, /login, /refresh
POST /auth/logout | GET /auth/me | POST /auth/reset-password
GET/POST/PATCH/DELETE /students, /schools, /programs, /tracks
GET/POST/PATCH/DELETE /ascg-profile, /cbc-profile
GET/POST/PATCH/DELETE /ascg-participation, /cbc-participation, /sc-participation, /program-participation
POST/PATCH/DELETE /academics/record|grade|performance|gpa|batch
GET  /academics/by-year?year=, /summary?year=
GET  /stats/overview, /stats/reach
GET  /users -> empty controller (no routes)
```

### Backend quirks frontend must handle
1. **Envelope:** `{ statusCode, data }` — unwrap `res.data.data`.
2. **Errors:** `{ statusCode, message: string | string[] }`.
3. **Auth today:** `GET` public, writes need `Bearer <15m>`. Refresh 7d.
4. **No CORS** in `src/main.ts` — add `enableCors` for 5173/5174.
5. **No pagination:** `GET /students` returns `[rows, total]`. ~13k rows needs virtualization.
6. **No RBAC / no 2FA:** no `role`, `JwtPayload={sub,email}`, no otplib, empty `UsersController`.
7. **Stats shapes implemented** — see Section 5 DTOs.

## 2. Architecture — two apps, shared packages

```
frontend/
  dtos.ts
  controller-types.ts
  IMPLEMENTATION_PLAN.md        <- this file
apps/
  viewer/                       <- App 1: view + add student (board + key_staff)
  admin/                        <- App 2: full CRUD (admin only)
packages/
  types/                        <- copy of dtos.ts + controller-types.ts
  api-client/                   <- axios + envelope unwrap + refresh + tempToken 2FA
  ui/                           <- AppShell, KpiCard, charts, tables, EmptyState, tokens
```

- Per app: `Vite + React 18 + TS + React-Router v6 + TanStack Query v5 + Axios + Recharts + Tailwind (or CSS tokens) + React-Hook-Form + Zod + Vitest + Playwright`.
- Shared `VITE_API_URL`, auth flow, envelope handling.
- Tradeoff vs single SPA: ~30% more work, but isolation + smaller viewer bundle + delete protection.

## 3. Scope split

### App 1: Viewer (`apps/viewer`, :5173)
Pages: Overview, Reach, ASCG academic, CBC (empty), Programme 3 (placeholder), Register (search/view), Data quality (read-only), Board summary, Metrics to add, Login + 2FA.

Writes: `POST /students` + `POST /students/batch` only (key_staff). No edit/delete.

### App 2: Admin (`apps/admin`, :5174)
Viewer + `PATCH/DELETE /students`, reference CRUD (`schools, programs, tracks, *-profile, *-participation`), academics editor + batch, CSV import report `{created,existing,skipped,failed}`, Users management, 2FA reset.

## 4. Roles & permissions (final)

| Capability | board (Viewer) | key_staff (Viewer) | admin (Admin) |
|---|---|---|---|
| Board summary | ✅ only this | ✅ | ✅ |
| Overview / Reach / ASCG / Quality | ❌ blocked | ✅ view | ✅ |
| Register search/view | ❌ | ✅ | ✅ |
| Add student | ❌ | ✅ | ✅ |
| Edit/delete, reference CRUD, academics writes, users | ❌ | ❌ | ✅ |

- `programme_staff` deferred (enum placeholder only).
- `type Role = 'key_staff' | 'programme_staff' | 'board' | 'admin'`.
- Board sees aggregates only; router forces `board` to `/board`.

## 5. Auth design — password + mandatory TOTP 2FA, admin-provisioned

### Backend changes (Dev A)
```ts
role: Role;                          // 'key_staff' | 'programme_staff' | 'board' | 'admin'
twoFactorSecret?: string | null;     // encrypted TOTP secret
twoFactorEnabled: boolean;
twoFactorBackupHashes?: string[];    // argon2-hashed 8x single-use codes
```
Libraries: `otplib + qrcode`.

Endpoints:
```
POST /auth/login {email,password} -> { requires2fa: true, tempToken }
POST /auth/2fa/verify {tempToken, code} -> { user, accessToken, refreshToken }
POST /auth/2fa/backup {tempToken, backupCode} -> { user, accessToken, refreshToken }
POST /auth/2fa/setup        (Bearer temp) -> { otpauthUrl, qrDataUrl }
POST /auth/2fa/verify-setup {tempToken, code} -> { backupCodes[], user, accessToken, refreshToken }
POST /auth/2fa/disable {password, code}
GET  /auth/me -> { id, name, email, role, twoFactorEnabled }
POST /users {name,email,role,tempPassword} (admin only)
GET  /users (admin only)
PATCH /users/:id/role {role} (admin only)
POST /users/:id/reset-2fa (admin only)
POST /users/:id/reset-password {tempPassword} (admin only)
Lock POST /auth/register to admin-only or remove.
```

- JWT becomes `{ sub, email, role }`. Access 15m, refresh 7d, tempToken 5-min.
- `RolesGuard` + `@Roles(...)`. Board GET scoped to stats/summary only.
- `app.enableCors({ origin: ['http://localhost:5173','http://localhost:5174'] })`.
- Backup codes mandatory to avoid lockout.

### Frontend auth flow (both apps)
```
Login (email+password) -> 2FA Challenge (6-digit + backup-code fallback) -> App
First login (temp password): Set new password -> Show QR -> Scan
  -> Confirm code -> Save backup codes -> In
```
Guards: `RequireAuth + RequireRole + Require2FA`. Viewer `RequireRole(['key_staff','board'])` + `BoardOnly -> /board`. Admin `RequireRole(['admin'])`.

## 6. Timeline — 2 developers, ~4 weeks

Split: **Dev A = backend** (roles+2FA+provisioning+CORS+guards). **Dev B = frontend** (monorepo+Viewer, then Admin). Branches: `feat/auth-roles-2fa` (A), `feat/frontend-foundation` (B, mocks until Week 1 done).

### Week 0 (2-3d) — Local unblock [A]
CORS, ports, temp-password policy, backup storage, seed 3 test users (board/key_staff/admin).

### Week 1 — Auth backend [A] / Foundation on mocks [B]
**A:** columns + migration, otplib+qrcode, temp-token, RolesGuard, JWT role, endpoints + tests. Milestone: Postman 2FA login works.
**B:** scaffold apps/* + packages/*, AppShell (PROGRAMMES/RECORDS/GOVERNANCE), guards, Login/2FA/QR/Backup/Set-password, Recharts wrappers, tokens.css. Milestone: both boot on mocks.
**Sync:** tempToken transport + `me` shape.

### Week 2 — Viewer MVP (converge)
**A:** board isolation, viewer POST /students for key_staff, rate-limit, audit log, seeds.
**B:** wire Overview (`stats/overview`), Reach (`stats/reach`), ASCG (`academics/by-year`), Board summary, Register search + detail (virtualized), Add-student + batch report, board forced to /board, CBC/P3 empty states.
**Milestone:** Viewer usable locally.

### Week 3 — Admin MVP
**A:** users admin, batch hardening, `?page&limit` (or confirm client filtering OK), recovery drill.
**B:** clone Viewer -> Admin, unlock PATCH/DELETE, reference CRUD, academics editor + batch, delete guards, Users page.
**Milestone:** Admin can do everything.

### Week 4 — Harden + handover
Playwright (login+2FA, board isolation, add, admin edit), Vitest (api-client), lost-phone drill, README (ports + policy), CBC/P3 placeholders. **Milestone: demo-ready.**

Total: **~4 weeks with 2 devs** (vs 7-8 solo). Viewer alone end of Week 2.

## 7. Frontend module map

```
src/api/client.ts        axios + envelope unwrap + rotation + tempToken
src/api/types/           copy of dtos.ts + controller-types.ts
src/api/hooks/           useOverview, useReach, useAcademicYear, useStudents, ...
src/auth/                AuthProvider, RequireAuth, RequireRole, BoardOnly, 2FA pages
src/layouts/AppShell.tsx sidebar + topbar (port from mock)
src/pages/{Overview,Reach,Ascg,Cbc,Programme3,Register,StudentDetail,Quality,Board,Backlog,Login,TwoFactor,Setup2FA}
src/components/{KpiCard,LineChart,StackBar,BandsChart,DataTable,EditableGrid,EmptyState}
src/theme/tokens.css
```

## 8. Deferred (out of scope v1)
- Student `combo` / VF-ID; programme_staff; CBC/P3 KPIs; cost-per-outcome; server pagination (virtualize v1); OAuth; mailed resets (admin resets manually).

## 9. Next action
1. Week 0-1 backend specs: DTOs + migration for `role` + 2FA + provisioning.
2. Scaffold apps + packages with mocked auth.
3. Wire Viewer MVP once Week 1 backend lands.


