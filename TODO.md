# TODO – Build the full academic management starter

## Current snapshot
- The Bun API already exposes `faculties`, `programs`, `classes`, `courses`, `classCourses`, `exams`, `students`, `grades`, and `users` through tRPC (`apps/server/src/routers/index.ts`), yet the flows are mostly recap-oriented.
- The Drizzle schema covers core academic tables, but there are no entities for Auth ↔ Domain separation, enrollments, UE/EC hierarchies, analytics, or archives (`docs/analyze.md`).
- A React + i18next shell lives in `apps/web`; Better Auth wiring exists and the login screen correctly uses translations (`pages/auth/Login.tsx`), but the rest of the UI is still bare.
- The comprehensive product specs (`docs/analyze.md`) require a service-oriented architecture and a split between identity and business users (`docs/auth-domain-arch-diagram.md`).

## Guardrails to remember
- [ ] Keep every existing flow (recap generation, current TRPC modules) working after each iteration.
- [ ] Enforce a 1:1 split between Better Auth (`auth.user`) and business profiles (`domain.user`) as recommended in the Auth ↔ Domain diagram.
- [ ] Require i18next/`useTranslation` for every new UI surface (see Code of Conduct and `apps/web/src/pages/auth/Login.tsx`).
- [ ] Prepare the modular/micro-service shape described in `docs/analyze.md` (Student, UE/EC, Grades, Analytics, Archive services).
- [ ] Back every new module with Bun/TRPC tests (`bun test apps/server`) plus router E2E suites (`routers/__tests__`).
- [ ] Run Biome, `bun run check`, and validate Drizzle migrations before shipping.

## Phase 0 – Stabilize & map the baseline (Week 0–1)
- [x] Document the current modules, tables, and TRPC routes in `docs/architecture.md`.
- [x] Add smoke tests for each existing router to lock today’s behavior.
- [x] Clean and document seeds/fixtures in `apps/server/src/lib/test-utils.ts` so recaps can be reproduced in any environment.
- [x] Define the sensitive-data strategy (`.env`, Better Auth secrets) and review Hono CORS config (`apps/server/src/index.ts`) to ease future web/mobile clients.
- [x] Inventory current Drizzle migrations (`apps/server/src/db/migrations`) and define a naming/versioning convention.

## Phase 1 – Identity, roles, and access governance (Week 1–3)
- [x] Create the `domain_users` (or `user_profiles`) table plus Drizzle entities with a mandatory FK to `auth.user`, and store business metadata (academic role, registration identifiers, status).
- [x] Refactor `students`, `teachers`, and `administrators` modules to rely on `domain_users` instead of `auth.user.id` directly (touch `modules/users/*.ts`, `modules/students/*.ts`, etc.).
- [x] Extend `createContext` (`apps/server/src/lib/context.ts`) to load the business profile, RBAC/ABAC roles, and contextual permissions (zero-trust guidance from `docs/analyze.md`).
- [x] Introduce a `modules/authz` package encapsulating RBAC policies, ABAC attributes, and time-bound CBAC checks; enforce it in critical routers (`grades`, `exams`, `programs`).
- [x] Add security-focused TRPC tests (protected procedures, unauthorized access cases).
- [x] Update the web docs/state (`apps/web/src/store`) to describe which roles can call which routes and prepare guards for future layouts.

## Phase 2 – Academic models and orchestration (Week 2–4)
- [ ] Extend the schema with explicit UEs and ECs (program → UE → EC hierarchy, coefficients, ECTS) per `docs/analyze.md#gestion-des-programmes-ues-et-ecs`.
- [ ] Add an `enrollments` table to track student ↔ class ↔ academic year history and support transfers.
- [ ] Finish `classes`, `courses`, and `classCourses` modules so they validate prerequisites, workloads, and default teacher approvals.
- [ ] Build out `modules/exams` to manage scheduling, percentages, locking, and dean approvals.
- [ ] Enhance `modules/grades` to support entry, UE consolidation, weighted averages (`docs/analyze.md#gestion-des-notes-et-résultats`), and instructor feedback loops.
- [ ] Provide CSV import/export flows for grades and attendance to match teacher workflows (`docs/analyze.md#enseignants`).
- [ ] Document student/teacher/dean workflows in `docs/workflows.md` to feed Phase 3 UI work.

## Phase 3 – User workflows & client surfaces (Week 4–6)
- [ ] Ship a TRPC router (`modules/workflows`) exposing key actions: grade validation, enrollment open/close, attendance alerts.
- [ ] Add background jobs (queue or Bun cron) for recurring tasks (exam session closure, archive notifications) per the workflows in `docs/analyze.md`.
- [ ] Structure `apps/web` by role-based layouts (admin/dean/teacher/student) with permission-aware navigation and react-i18next everywhere.
- [ ] Design pages for grade entry, performance tracking, and monitoring dashboards (tables, charts) aligned with `docs/analyze.md#workflows-utilisateur`.
- [ ] Stand up a `notifications` module for email/webhook alerts (submission, rejection, closing windows).
- [ ] Add router E2E tests (`apps/server/src/routers/__tests__`) that simulate the critical flows (teacher submits → dean approves → student views).

## Phase 4 – Analytics, archiving, and integrations (Week 6+)
- [ ] Introduce an event bus or publication mechanism (Kafka/RabbitMQ/existing Bun queue) to broadcast enrollments, grades, attendance (`docs/analyze.md` “Bus de messages”).
- [ ] Build the `analytics` service: OLAP aggregation, KPIs (success rate, attendance, demand) and dashboard APIs for decision makers.
- [ ] Implement the `archives` module following the university retention guidelines (`docs/analyze.md#système-d’archivage-robuste`): year-based retention, access policies, retrieval APIs.
- [ ] Provide regulatory exports (PDF transcripts, accreditation reports) and reuse the current recap pipeline when possible.
- [ ] Prepare external integrations (finance, LMS) via isolated adapters and document their contracts.
- [ ] Define SLAs, the scaling/partitioning approach, and monitoring plans (logs, traces, metrics).

## DevEx, QA & governance
- [x] Add `CODE_OF_CONDUCT.md` to codify collaboration and reiterate the i18n requirement for UI work.
- [ ] Create `CONTRIBUTING.md` describing Bun commands, commit conventions, and review flow.
- [ ] Automate Biome, test, and `bun run check-types` in CI (GitHub Actions or similar) prior to merges.
- [ ] Author `docs/security.md` covering MFA, RBAC/ABAC, and zero-trust practices.
- [ ] Plan the migration of existing data into the new model (Bun scripts + versioned Drizzle migrations).
- [ ] Expand observability (structured logs, OpenTelemetry traces) to debug multi-service flows.
- [ ] Maintain an i18n backlog: translation resources and `bun run --filter web i18n:gen` after every new key.
- [ ] Document testing strategies (unit, integration, E2E) and quality KPIs (coverage, runtime).

## References
- `docs/analyze.md` – Full functional specification.
- `docs/auth-domain-arch-diagram.md` – Auth ↔ Domain strategy.
- `apps/server/src` – Current API modules.
- `apps/web/src` – React + i18next client shell.
- Useful commands: `bun run dev:server`, `bun run dev:web`, `bun run check`, `bun test apps/server`.
