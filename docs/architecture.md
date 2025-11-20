# Current Architecture Snapshot

This document captures the state of the system before we branch into the full academic management starter. It acts as a map for Phase 0 of the roadmap so we can prove regressions quickly and understand where new capabilities will attach.

## Runtime overview
- **API** – Bun + Hono + tRPC entrypoint at `apps/server/src/index.ts`. Middlewares: logger + CORS (GET/POST/OPTIONS, credentials, `CORS_ORIGIN` env).
- **Auth** – Better Auth configured in `apps/server/src/lib/auth.ts` with Drizzle adapter and admin plugin. Trusted origins inherit `CORS_ORIGIN`.
- **Domain identity** – `domain_users` decouples business profiles from Better Auth. `apps/server/src/lib/context.ts` stitches session + profile + permission snapshot via `modules/authz`, and the new RBAC helpers back every `adminProcedure`/`superAdminProcedure`.
- **Client shell** – React + Vite app in `apps/web` wired to Better Auth. Login flow demonstrates the required i18next usage, and the Zustand store now persists the permission snapshot exported by the API so future guards can mirror the server rules.

## Routers & modules

| Router | Procedures | Notes |
| --- | --- | --- |
| `healthCheck` | `query` | Public ping route, returns `"OK"`. |
| `privateData` | `query` | Protected example response, echoes session user. |
| `faculties` | `list`, `create`, `update`, `delete` | Fully covered by tests (`modules/faculties/__tests__`). |
| `programs` | `list`, `create`, `update`, `delete` | Requires faculty FK, includes pagination support. |
| `academicYears` | `list`, `create`, `update`, `delete`, `setActive` | Enforces `endDate > startDate`. |
| `classes` | CRUD + filtering by program/year | Binds programs and academic years. |
| `teachingUnits` | CRUD | Manages the UE layer (code, semester, credits) under a program. |
| `courses` | CRUD | Stores credits, hours, default teacher, the UE link, and prerequisite graph. |
| `classCourses` | CRUD | Links a class to a course/teacher, validates prerequisites and workload approvals. |
| `enrollments` | CRUD + list | Tracks student ↔ class ↔ academic year history. Mutations in `students`/`classes` keep this table in sync. |
| `exams` | CRUD + workflow (`submit`, `validate`, `lock`) | Handles scheduling, approval, and locking of assessments. |
| `students` | CRUD + list | Maintains registration number/class while personal data (names, DoB, birthplace, gender, etc.) lives in `domain_users`. Every create/update also touches `enrollments`. |
| `grades` | CRUD + list | Stores score per student/exam, enforces uniqueness. |
| `users` | `list` | Lists business profiles (teachers/admins) from `domain_users` joined with Better Auth metadata for pagination/filtering (smoke tests in `modules/users/__tests__`). |

> All routers share the context from `apps/server/src/lib/context.ts`, which now injects both the Better Auth session and the linked domain profile/permission snapshot.

## Database schema (Drizzle)
- `faculties`, `programs`, `teaching_units`, `classes`, `courses`, `class_courses`, `academic_years`, `students`, `exams`, `grades`, `course_prerequisites`, `enrollments`, `domain_users` – defined in `apps/server/src/db/schema/app-schema.ts`.
- Better Auth tables `user`, `session`, `account`, `verification` – in `apps/server/src/db/schema/auth.ts`.
- `domain_users` binds each business profile to an optional `auth.user` and enforces the personal data required by the client (date/place of birth, gender, phone, status). Students reference `domain_users` through `domain_user_id`, and the new `enrollments` table preserves class history per academic year.

## Test fixtures & recap data
- `apps/server/src/lib/test-utils.ts` centralizes factories for every model plus the new `createRecapFixture` helper that provisions a complete faculty → program → teaching unit → class → course → exam → student → enrollment → grade chain. Students and teachers are now created through `createDomainUser` so FI data (names, DoB, gender, birthplace) is always present when tests run.
- Seed helpers rely on Better Auth’s testing adapter (`./lib/test-db`) so auth-bound resources are always valid.

## Environment & security posture
- `.env` / `.env.example` define the sensitive knobs that must be present everywhere:
  - `CORS_ORIGIN` – shared between Hono CORS middleware and Better Auth trusted origins. Use explicit origins (e.g., `https://app.example.com`), never `*` in shared environments.
  - `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` – originate from the Auth provider, should be injected via secret managers (sops, Doppler, etc.).
  - `DATABASE_URL` – points to PostgreSQL; for local dev we rely on `.env`, for CI/production use provider-managed secrets.
- Hono is already configured for credentialed requests (cookies/auth headers). Future clients must use the same origin defined above, so maintain consistency between `.env`, deployment, and reverse proxies.

## Migrations & conventions
- Current Drizzle migrations: `0000_tough_ezekiel_stane.sql`, `0001_domain_users_split.sql`, and `0002_phase2_academic_models.sql` (with `meta/` managed by Drizzle).
- Naming plan going forward: `YYYYMMDDHHMM_<short-description>.sql` to keep ordering obvious in Git history, stored under the same directory, generated via `bun run --filter server db:generate`.
- Always commit the SQL migration plus the generated snapshot from Drizzle to avoid drift across environments.

## Notable Phase 2 behaviors
- Exams follow a workflow: draft/scheduled → submitted → approved/rejected → locked. Grading endpoints now enforce `status === "approved"` before mutating, and locking requires approval.
- CSV support: `grades.importCsv` ingests `registrationNumber,score` pairs per exam, and `grades.exportClassCourseCsv` dumps the current results for a class-course. These endpoints power the teacher tooling described in `docs/analyze.md`.
- `grades.getStudentTranscript` consolidates grades per UE and calculates weighted averages using course credits (foundation for the analytics module).
- Transfers/deletions on classes automatically move students back to a valid class and append enrollment records, keeping the history auditable.
