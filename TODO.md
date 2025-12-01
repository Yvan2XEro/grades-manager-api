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
- [x] Extend the schema with explicit UEs and ECs (program → UE → EC hierarchy, coefficients, ECTS) per `docs/analyze.md#gestion-des-programmes-ues-et-ecs`.
- [x] Add an `enrollments` table to track student ↔ class ↔ academic year history and support transfers.
- [x] Finish `classes`, `courses`, and `classCourses` modules so they validate prerequisites, workloads, and default teacher approvals.
- [x] Build out `modules/exams` to manage scheduling, percentages, locking, and dean approvals.
- [x] Enhance `modules/grades` to support entry, UE consolidation, weighted averages (`docs/analyze.md#gestion-des-notes-et-résultats`), and instructor feedback loops.
- [x] Provide CSV import/export flows for grades and attendance to match teacher workflows (`docs/analyze.md#enseignants`).
- [x] Document student/teacher/dean workflows in `docs/workflows.md` to feed Phase 3 UI work.

## Phase 2.1 – Atomic enrollment & cycle hierarchy (current)
- [x] Implement the `student_course_enrollments` table + module described in `docs/atomic-enrollment-and-cycles.md` (atomic course registrations, attempts, audit trail).
- [x] Enforce roster validation in `modules/exams` and `modules/grades` using the new enrollment records.
- [x] Build the credit ledger materialization + promotion helpers (including migrations/backfills and fixtures).
- [x] Introduce `study_cycles` and `cycle_levels` with per-faculty ownership, connect programs/classes/enrollments, and expose CRUD routers.
- [x] Seed/migrate existing data into cycles/levels, tagging historical classes with the right level reference.
- [x] Add scaffolding for `json-rules-engine` (rule registry + config storage) to eventually drive promotion/eligibility checks.
- [x] Document admin UX requirements for managing rule sets and cycle hierarchies.

### Frontend impact (atomic enrollment + ledger)
- [ ] Extend the enrollment UI so admins can enroll/withdraw students per course, view attempts, and trigger retakes (new tRPC hooks + optimistic updates).
- [ ] Surface the credit ledger and promotion readiness on the student dashboard (progress bars, `json-rules-engine` verdicts, i18n strings).
- [ ] Add an admin screen for rule management (list default rules, prepare overrides per faculty/program, save future configs).
- [ ] Update transcript/analytics pages to use ledger totals (earned vs. in-progress credits, warnings when credits fall short).
- [ ] Cover the new UI with RTL/Playwright tests (course enrollment flow, credit overview, rule inspection).

## Phase 3 – User workflows & client surfaces (Week 4–6)
- [x] Ship a TRPC router (`modules/workflows`) exposing key actions: grade validation, enrollment open/close, attendance alerts.
- [x] Add background jobs (queue or Bun cron) for recurring tasks (exam session closure, archive notifications) per the workflows in `docs/analyze.md`.
- [x] Structure `apps/web` by role-based layouts (admin/dean/teacher/student) with permission-aware navigation and react-i18next everywhere.
- [x] Design pages for grade entry, performance tracking, and monitoring dashboards (tables, charts) aligned with `docs/analyze.md#workflows-utilisateur`.
- [x] Stand up a `notifications` module for email/webhook alerts (submission, rejection, closing windows).
- [x] Add router E2E tests (`apps/server/src/routers/__tests__`) that simulate the critical flows (teacher submits → dean approves → student views).

## Phase 4 – UI alignment with backend capabilities (Week 6+)
- [x] Synchronize TRPC clients and generated types (teaching units, notifications, workflows, enrollments) and expose dedicated React Query hooks.
- [x] Implement teaching-unit and prerequisite admin screens (CRUD forms, client-side validation, TRPC/i18n error handling).
- [x] Add the enrollment management module on the UI (visualize enrollments, open/close windows, handle transfers).
- [x] Wire the exam/alert workflows (teacher/dean) with realtime feedback (toasts + notifications).
- [x] Integrate notifications (list, ACK, flush) in a shared panel for authorized roles.
- [x] Complete the dashboards (admin/dean/teacher/student) with consolidated data (transcripts, program stats).
- [x] Add UI end-to-end tests (Playwright or Vitest+RTL) for the critical flow: schedule exam → submit → validate → enter grades.

## Phase 5 – Analytics & Archival Readiness
- [ ] Define and ship the `analytics` router (UE aggregations, cohort KPIs, attendance trends).
- [ ] Build the analytics dashboards (admin/dean) with CSV/PDF export.
- [ ] Implement the `archives` module (retention policies, access control, search, audit logs).
- [ ] Prepare regulatory exports (PDF transcripts, accreditation reports) and automate signature/validation workflows.
- [ ] Strengthen observability (structured logging, metrics dashboards, alerting) and document SLAs.

## Phase 6 – External integrations & hardening
- [ ] Add adapters for partner systems (LMS, finance, reporting) within the monolith (no microservices).
- [ ] Cover advanced security scenarios (secure webhooks, audits, alerts) and write `docs/security.md`.
- [ ] Industrialize CI/CD: lint/format/test automation, mandatory reviews, orchestrated migration/seed scripts.
- [ ] Plan historical data migration (replay scripts, rollback strategy) and estimate infra/support costs.

## DevEx, QA & governance
- [x] Add `CODE_OF_CONDUCT.md` to codify collaboration and reiterate the i18n requirement for UI work.
- [ ] Create `CONTRIBUTING.md` describing Bun commands, commit conventions, and review flow.
- [ ] Automate Biome, test, and `bun run check-types` in CI (GitHub Actions or similar) prior to merges.
- [ ] Author `docs/security.md` covering MFA, RBAC/ABAC, and zero-trust practices.
- [ ] Plan the migration of existing data into the new model (Bun scripts + versioned Drizzle migrations).
- [ ] Expand observability (structured logs, OpenTelemetry traces) to debug multi-service flows.
- [ ] Maintain an i18n backlog: translation resources and `bun run --filter web i18n:gen` after every new key.
- [ ] Document testing strategies (unit, integration, E2E) and quality KPIs (coverage, runtime).
- [ ] Define the governance process for decision rules (versioning, review, rollout) once `json-rules-engine` powers eligibility logic.

## References
- `docs/analyze.md` – Full functional specification.
- `docs/auth-domain-arch-diagram.md` – Auth ↔ Domain strategy.
- `docs/atomic-enrollment-and-cycles.md` – Blueprint for atomic enrollments, cycle hierarchy, and rule-engine integration.
- `apps/server/src` – Current API modules.
- `apps/web/src` – React + i18next client shell.
- Useful commands: `bun run dev:server`, `bun run dev:web`, `bun run check`, `bun test apps/server`.
