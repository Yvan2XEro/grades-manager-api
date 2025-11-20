# Current Architecture Snapshot

This document captures the state of the system before we branch into the full academic management starter. It acts as a map for Phase 0 of the roadmap so we can prove regressions quickly and understand where new capabilities will attach.

## Runtime overview
- **API** – Bun + Hono + tRPC entrypoint at `apps/server/src/index.ts`. Middlewares: logger + CORS (GET/POST/OPTIONS, credentials, `CORS_ORIGIN` env).
- **Auth** – Better Auth configured in `apps/server/src/lib/auth.ts` with Drizzle adapter and admin plugin. Trusted origins inherit `CORS_ORIGIN`.
- **Client shell** – React + Vite app in `apps/web` wired to Better Auth. Login flow demonstrates the required i18next usage.

## Routers & modules

| Router | Procedures | Notes |
| --- | --- | --- |
| `healthCheck` | `query` | Public ping route, returns `"OK"`. |
| `privateData` | `query` | Protected example response, echoes session user. |
| `faculties` | `list`, `create`, `update`, `delete` | Fully covered by tests (`modules/faculties/__tests__`). |
| `programs` | `list`, `create`, `update`, `delete` | Requires faculty FK, includes pagination support. |
| `academicYears` | `list`, `create`, `update`, `delete`, `setActive` | Enforces `endDate > startDate`. |
| `classes` | CRUD + filtering by program/year | Binds programs and academic years. |
| `courses` | CRUD | Stores credits, hours, and default teacher (Better Auth `user`). |
| `classCourses` | CRUD | Links a class to a course and teacher. |
| `exams` | CRUD | Handles weights (`percentage`) and lock flag. |
| `students` | CRUD + list | Maintains registration number and class assignment. |
| `grades` | CRUD + list | Stores score per student/exam, enforces uniqueness. |
| `users` | `list` | Reads Better Auth users with cursor pagination and filters (new smoke test in `modules/users/__tests__`). |

> All routers share the context from `apps/server/src/lib/context.ts`, which today only injects the Better Auth session. Phase 1 will extend this with domain profiles/roles.

## Database schema (Drizzle)
- `faculties`, `programs`, `classes`, `courses`, `class_courses`, `academic_years`, `students`, `exams`, `grades` – defined in `apps/server/src/db/schema/app-schema.ts`.
- Better Auth tables `user`, `session`, `account`, `verification` – in `apps/server/src/db/schema/auth.ts`.
- Foreign keys already connect courses/classCourses to Better Auth `user.id`, which is why the Auth ↔ Domain split is the next priority.

## Test fixtures & recap data
- `apps/server/src/lib/test-utils.ts` centralizes factories for every model plus the new `createRecapFixture` helper that provisions a complete faculty → program → class → course → exam → student → grade chain. This fixture is how we reproduce the recap dataset locally/in CI before extending the feature set.
- Seed helpers rely on Better Auth’s testing adapter (`./lib/test-db`) so auth-bound resources are always valid.

## Environment & security posture
- `.env` / `.env.example` define the sensitive knobs that must be present everywhere:
  - `CORS_ORIGIN` – shared between Hono CORS middleware and Better Auth trusted origins. Use explicit origins (e.g., `https://app.example.com`), never `*` in shared environments.
  - `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` – originate from the Auth provider, should be injected via secret managers (sops, Doppler, etc.).
  - `DATABASE_URL` – points to PostgreSQL; for local dev we rely on `.env`, for CI/production use provider-managed secrets.
- Hono is already configured for credentialed requests (cookies/auth headers). Future clients must use the same origin defined above, so maintain consistency between `.env`, deployment, and reverse proxies.

## Migrations & conventions
- Current Drizzle migration: `apps/server/src/db/migrations/0000_tough_ezekiel_stane.sql` (with `meta/` managed by Drizzle).
- Naming plan going forward: `YYYYMMDDHHMM_<short-description>.sql` to keep ordering obvious in Git history, stored under the same directory, generated via `bun run --filter server db:generate`.
- Always commit the SQL migration plus the generated snapshot from Drizzle to avoid drift across environments.
