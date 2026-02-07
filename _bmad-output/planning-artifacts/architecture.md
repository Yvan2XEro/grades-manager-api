---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-05-patterns
inputDocuments:
  - path: _bmad-output/planning-artifacts/prd.md
    description: Retake exams PRD
  - path: _bmad-output/planning-artifacts/retake-exams-analysis.md
    description: Retake domain analysis
  - path: docs/architecture.md
    description: Current TKAMS architecture snapshot
  - path: docs/admin-exam-enhancements.md
    description: Admin exam workflow enhancements
  - path: docs/exam-grade-delegation.md
    description: Grade delegation design notes
  - path: docs/PROMOTION_RULES_GUIDE.md
    description: Promotion rules system guide
  - path: docs/institution-multi-tenant-plan.md
    description: Institution/organization alignment plan
workflowType: 'architecture'
project_name: 'TKAMS (Tefoye and Kana Academic Management System)'
user_name: 'Yvan'
date: '2026-01-09T02:13:11+01:00'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**  
FR1–FR20 focus on four pillars: (1) eligibility engine with overrideable reason codes, (2) retake session lifecycle management tied to base exams, (3) teacher-grade workflows that surface both attempts while preserving approvals, and (4) promotion/audit surfaces that recompute ledgers and expose policy outcomes. These capabilities require new data structures for session linkage, attempt history, and policy configuration while reusing existing exams/grades/promotion services. Access control and rollout toggles are explicitly part of the functional scope.

**Non-Functional Requirements:**  
NFRs emphasize parity with current exam/promotion latency budgets (eligibility queries and ledger recalcs finishing within ~1 minute), strict audit logging for every override/validation, rollout safety (feature flags + kill switches), and maintaining existing WCAG-level accessibility in admin/teacher shells. Security inherits the existing RBAC snapshot but must ensure no retake API runs outside the base exam and policy context.

**Scale & Complexity:**  
Brownfield web stack (Bun/Hono/tRPC + React SPA) with medium complexity: multiple user personas, cross-module data flows (exams ⇄ grades ⇄ promotion), and multi-tenant readiness from the institution plan. Estimated architectural components: eligibility service, retake session manager, grading context enhancements, promotion recalculation hooks, policy configuration surfaces, and audit/reporting views. Complexity drivers include cross-cutting promotion recalcs and upcoming multi-tenant isolation.

- Primary domain: Web app / API-backed admin + teacher workflows  
- Complexity level: Medium brownfield (core logic touchpoints but reusing infrastructure)  
- Estimated components: 5–6 cohesive services/modules

### Technical Constraints & Dependencies

- Must leverage existing Bun/Hono/tRPC server, Drizzle schema, Better Auth context, and SPA routing—no parallel services.  
- Promotion rules engine and student ledger recalculation pipelines must stay authoritative; retake logic plugs into those flows (no forked rules).  
- Institution/organization alignment plan introduces `institution_id` scoping; retake entities and queries must be institution-aware to avoid cross-tenant leakage.  
- Admin exam enhancements and grade delegation work share the same exam router and UI primitives—new retake features must coexist with pagination, filters, and delegation permissions.  
- Database migrations need to add session type/attempt/policy tables while preserving backwards compatibility for existing exams.  
- Rollout depends on feature flags and audit logs already used for other modules.

### Cross-Cutting Concerns Identified

- **Auditability & Compliance:** Every eligibility override, grading action, and promotion delta requires end-to-end traceability (registrar, teacher, promotion officer).  
- **Policy Enforcement:** Retake scoring modes and attempt limits must be enforced consistently across eligibility, grading, and promotion recompute logic.  
- **Promotion Recalculation:** Ledger updates and facts recalculations are triggered synchronously with grade validation, so transaction boundaries and retry strategy affect multiple services.  
- **RBAC & Delegation:** Registrar/teacher/promotion roles (plus exam delegates) need consistent capability checks across admin and teacher surfaces.  
- **Multi-tenant Readiness:** All new tables and queries must include `institution_id` so the upcoming organization alignment doesn’t require rewrites.  
- **UX Consistency:** Admin/teacher SPAs reuse shared components; retake indicators, filters, and navigation must tap into the same primitives introduced for admin exam enhancements.

## Starter Template Evaluation

### Primary Technology Domain

Existing Bun/Hono/tRPC backend + React SPA admin/teacher clients (monorepo already provisioned). This is a brownfield extension, so we stay inside the current stack rather than scaffolding a new starter.

### Starter Options Considered

- **Status quo (Bun + Hono + tRPC + Drizzle + React/Vite SPA):** Already running in production, matches deployment/runtime tooling, and is where exams/grades/promotion code lives.
- **New starter (Next.js/NestJS/etc.):** Rejected for MVP because it would require duplicating routers, auth context, and deployment pipelines without adding value for an additive feature.

### Selected Starter: Existing TKAMS Monorepo Stack

**Rationale for Selection:** Retake exams touch the live exams/grades/promotion modules. Building on the current Bun/Hono + React setup ensures we reuse TRPC routers, RBAC context, migrations, and shared UI primitives. Introducing a fresh starter would fragment the codebase and slow delivery with no benefit.

**Initialization Command:** _N/A — extend the existing workspaces (`apps/server`, `apps/web`)._

**Architectural Decisions Provided by Starter:**

- **Language & Runtime:** TypeScript end-to-end, Bun runtime on the API, Vite-powered React SPA.
- **Styling Solution:** Continue using shadcn/ui + Tailwind already configured in `apps/web`.
- **Build Tooling:** Bun scripts + Vite + shared tsconfig; no new toolchains required.
- **Testing Framework:** Bun test runner already powering server specs and integration suites; reuse for retake flows.
- **Code Organization:** Feature modules under `apps/server/src/modules/*`, TRPC routers under `routers`, shared domain docs under `docs/`.
- **Development Experience:** Same DX (bun dev, bun test, shared lint/format via Biome); ensures new retake modules slot into existing workflows.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical:**  
- Extend `exams` with `session_type`, `parent_exam_id`, and enforce `institution_id` everywhere to support retake linkage.  
- Introduce `student_exam_attempts` to track attendance/lifecycle independent of grades.  
- Wire promotion recalculation to retake validation events so ledgers/facts stay authoritative.  
- Keep RBAC/audit controls consistent when surfacing eligibility, grading, and promotion data.

**Important:**  
- Lightweight retake policy configuration (program-level JSON or small table) with `max_attempts` and `scoring_strategy`.  
- Eligibility service backed by existing enrollment/grade/promotion data; retake session manager to seed attempts.  
- Teacher grading context upgrade that reuses current workflow but surfaces attempt history.  
- Audit logging reused across registrar, teacher, promotion flows.

**Deferred/Post-MVP:**  
- Course-level policy overrides, multi-wave retakes, analytics dashboards, student self-service, advanced compensation rules.

### Data Architecture

- **Schema changes:**  
  - `exams`: add `session_type` enum (`"normal" | "retake"`), `parent_exam_id` self-FK, ensure `institution_id` stays non-null.  
  - `student_exam_attempts` table (id, institution_id, student_course_enrollment_id, exam_id, attempt_no, status enum `planned/present/absent/graded/validated`, timestamps, unique constraints).  
  - `retake_policies`: start with program-level configuration (JSON column or small table) storing `max_attempts_per_course_per_year = 2` and `scoring_strategy = replace|best_of`, with future hooks for course overrides.  
  - All new tables/columns include `institution_id` and indexes consistent with multi-tenant plan.
- **Migrations:** additive Drizzle migrations that backfill existing rows with defaults (`session_type = 'normal'`, `parent_exam_id = null`, default policy values). No destructive changes.

### Authentication & Security

- Continue using Better Auth + domain RBAC. Only registrars create retake sessions, teachers/eligible delegates grade, promotion officers review; enforce via existing TRPC middlewares.  
- Feature flags guard retake endpoints per institution/class course.  
- Audit tables capture eligibility overrides, attempt status transitions, grade validations, and promotion impacts with actor/timestamp.

### API & Communication

- Extend existing TRPC routers (`exams`, `grades`, `promotion-rules`, new `retakes` submodule) with procedures for eligibility generation, retake creation, attempt updates, policy management, and promotion audit exports.  
- Use current request/response pattern (no sockets). Eligibility recompute triggered via TRPC mutation, promotion recalcs piggyback on grade validation pipeline.  
- Reuse existing error handling and logging conventions.

### Frontend Architecture

- Admin SPA: extend `/admin/exams` with retake filters/indicators, add eligibility generation UI, retake session creation modals, audit exports.  
- Teacher SPA: highlight retake context in grade entry, render original vs retake attempt columns, reuse grade delegation UI.  
- Promotion dashboard: add retake-focused panels (eligibility counts, pass rates, ledger deltas).  
- State management remains React Query + Zustand; surfaces share shadcn components and filters.

### Infrastructure & Deployment

- Same hosting/CI/CD (Bun server, existing pipelines).  
- Monitoring: add alerts for eligibility generator failures, ledger recalcs, and retake validation flows via current observability stack.  
- Rollout: feature flags + kill switches allow disabling retake creation or grading independently without affecting normal exams.

### Decision Impact Analysis

**Implementation sequence:**  
1. Schema/migrations (exams columns, student_exam_attempts, retake_policies).  
2. Eligibility service + retake session manager (server + admin UI).  
3. Teacher retake grading UX and TRPC endpoints.  
4. Promotion recalculation hook + dashboard surfaces.  
5. Audit/export flows and policy configuration UI.

**Dependencies:** Schema changes underpin all services; eligibility feeds retake session manager → attempts → grading → promotion recalcs. RBAC/audit requirements span every layer, so logging hooks must be added alongside service code. Feature flags wrap admin/teacher flows for safe rollout.

## Implementation Patterns & Consistency Rules

### Naming Patterns

- **Database & migrations:** snake_case table/column names, singular table names (`student_exam_attempts`), FK columns suffixed `_id`. Enums defined via `pgEnum` with lowercase members.  
- **Drizzle models:** keep existing naming style (camelCase field names in TypeScript, snake_case columns). Add indexes/constraints near the definition like existing tables.  
- **TRPC routers/procedures:** `retakesRouter` with verbs like `generateEligibility`, `createRetakeExam`, etc. Input/output types live beside router in `apps/server/src/modules/retakes`.  
- **Frontend routes/components:** follow existing folder conventions (`apps/web/src/pages/admin/retakes`, `components/retakes/...`). Use PascalCase for components, camelCase for hooks.

### Structure Patterns

- **Server modules:** New logic under `apps/server/src/modules/retakes` (services, validators, mappers). TRPC router glued via `apps/server/src/routers/retakes.ts`. Keep separation between service, router, schema, and tests (mirroring existing modules).  
- **Migrations:** One migration per schema change (`YYYYMMDDHHMM_add-retake-columns.sql`). Update `drizzle/meta` via `bun run --filter server db:generate`.  
- **Frontend:** Admin and teacher features live in their respective workspace directories. Shared UI primitives extended, not forked. Keep translation keys under existing namespace (e.g., `admin.retakes`).  
- **Tests:** Server unit tests under `modules/retakes/__tests__`, e2e in `apps/server/src/routers/__tests__/retakes.http.test.ts`. Frontend vitest/cypress follow current folder layout.

### Format Patterns

- **API responses:** Continue returning `{ data, meta? }` with TRPC; errors use `TRPCError` with standard codes/messages. Eligibility payload includes `studentId`, `reason`, `status`, `attemptNo`, ensure keys stay camelCase.  
- **Audit logs:** Use existing audit schema (if new table needed, follow `*_audit_logs` naming, payload JSON with explicit `context` keys). Timestamps stored as `timestamp with time zone`.  
- **Date/time:** Always ISO8601 UTC from server, format via dayjs on the client.  
- **Policy config:** For initial JSON configs, keep shape `{ maxAttemptsPerCoursePerYear: number; scoringStrategy: "replace" | "best_of" }`.

### Communication Patterns

- **Events/hooks:** Promotion recalculation triggered by existing grade validation path; extend event payload to include `retakeAttemptId`. No new global event bus—use service method calls.  
- **State updates:** React Query for server state, Zustand for session/global UI state. Eligibility lists use `useInfiniteQuery` like admin exams.  
- **Logging:** Use existing logger utility (structured logging) with `context: { feature: "retakes", ... }`.  
- **RBAC checks:** Centralize in server services (`assertRegistrar(ctx)` etc.) and reuse on frontend with existing permission hooks.

### Process Patterns

- **Loading & errors:** Admin/teacher UIs reuse shared loading skeletons/spinners. Toasts/messages go through existing notification utilities. Handle TRPC errors with standard `useToast` pattern.  
- **Validation:** Zod schemas for TRPC inputs; server-side guard ensures exam status before mutations. Frontend forms use existing `react-hook-form + zod` setup.  
- **Feature flags:** Gate new routes/components using current feature flag provider (likely reusing env-based config or feature flag context).  
- **Retry/recovery:** Eligibility generation is manual; errors surfaced to registrars with actionable messaging. Promotion recalcs rely on existing retry/backoff in ledger services; add logging when retake recalcs fail.

### Enforcement

- All AI agents MUST:  
  1. Add `institution_id` to every new table/query and filter by it in services.  
  2. Reuse existing TRPC router organization and service patterns; no ad-hoc endpoints.  
  3. Extend shared UI components/translations instead of creating duplicate primitives.  
- Pattern compliance verified via code review and automated lint/tests (Biome, Bun tests). Document deviations in `docs/architecture.md` if patterns evolve.

### Examples & Anti-patterns

- **Good:** `student_exam_attempts` table with `studentCourseEnrollmentId` referencing `student_course_enrollments.id`, service `createStudentExamAttempts` seeded during retake creation, React component `<RetakeBadge variant="warning" />` imported from shared UI.  
- **Avoid:** New service directories outside `modules/`, camelCase DB columns (`parentExamId`), custom fetch wrappers bypassing TRPC, UI strings hardcoded instead of using i18next keys.

## Project Structure & Boundaries

### Top-Level Mapping

- `apps/server` (Bun + Hono + tRPC)  
  - `src/db/migrations`: new migrations for retake schema changes.  
  - `src/db/schema/app-schema.ts`: add columns/tables (exams session fields, student_exam_attempts, retake_policies).  
  - `src/modules/retakes`: new module containing services (`eligibility-service.ts`, `session-manager.ts`, `policies-service.ts`), Zod validators, and tests.  
  - `src/routers/retakes.ts`: TRPC router exposing procedures for eligibility generation, retake creation, attempt updates, promotion audits.  
  - `src/routers/exams.ts` / `grades.ts`: extended endpoints for retake context (e.g., `getExamAttempts`).  
  - `src/lib/promotion`: extend recalculation hooks so retake validations trigger ledger updates.  
  - `src/lib/audit`: add retake events.  
  - Tests under `modules/retakes/__tests__` and `routers/__tests__/retakes.http.test.ts`.

- `apps/web` (React SPA)  
  - `src/pages/admin/retakes` (or extend `/admin/exams` with retake panels).  
  - `src/pages/teacher/GradeEntry.tsx`: retake-aware grade entry UI.  
  - `src/pages/promotion/RetakeDashboard.tsx`: optional promotion officer views.  
  - `src/components/retakes`: shared UI (badges, tables, dialogs).  
  - `src/hooks/useRetakeEligibility.ts`, etc.  
  - i18n keys under `locales/en/admin/retakes.json` (and other languages).  
  - State slices / stores under existing pattern (React Query hooks + Zustand if needed).

- `docs/`: add `docs/retakes-architecture.md` summarizing design, plus update `docs/workflows.md` as needed.

### Boundaries & Communication

- **API boundaries:**  
  - New TRPC router `retakesRouter` composed into `appRouter`.  
  - Existing `examsRouter` and `gradesRouter` call retake services where necessary.  
  - Promotion module exposes `triggerPromotionRecalc(studentId, examId)` used by retake validation.

- **Component/service boundaries:**  
  - Eligibility service reads from `students`, `grades`, `student_course_enrollments`, `promotion_facts`.  
  - Session manager owns creation of `exams` rows + `student_exam_attempts`.  
  - Promotion recalculation runs via existing ledger service; retake module just invokes it.  
  - Frontend admin features call retake endpoints; teacher UI stays in teacher module but fetches additional attempt data.

- **Data boundaries:**  
  - `student_exam_attempts` is the canonical source for attempt lifecycle; `grades` remain numeric result attached to `exam_id`.  
  - `retake_policies` stores per-program defaults; a future `course_retake_policies` table can override.  
  - All queries filter by `institution_id`; context ensures user’s institution matches records.

### Requirements → Structure Mapping

- **Eligibility & overrides (FR1–FR4):** `apps/server/src/modules/retakes/eligibility-service.ts`, admin UI in `apps/web/src/pages/admin/exams/RetakeEligibilityPanel.tsx`.  
- **Retake session management (FR5–FR8):** `session-manager.ts`, admin modals/components.  
- **Retake grading workflow (FR9–FR12):** updates to `apps/server/src/routers/grades.ts`, teacher page modifications, shared components for attempt columns.  
- **Promotion impact/audit (FR13–FR16):** promotion service extensions, new audit endpoints/UI.  
- **Policy/configuration (FR17–FR20):** `retake_policies` service + admin UI for setting defaults; feature flag management in config files.

### File Organization Patterns

- **Config:** `.env` + `.env.example` gain `RETAKES_FEATURE_FLAG` or similar; server config under `apps/server/src/config/retakes.ts`.  
- **Tests:** Mirror module structure (service tests use test-utils; router tests live in `routers/__tests__`). Frontend tests live alongside components or in dedicated `__tests__` directories.  
- **Assets:** Any new icons/badges stored under `apps/web/src/assets/retakes/`.

### Workflow Integration

- **Development:** Standard `bun dev:server` / `bun dev:web`; feature flags toggled in `.env`.  
- **Build:** No changes—`bun run build` builds both apps; new schema requires `bun run --filter server db:generate` + `bun run db:migrate`.  
- **Deployment:** Existing pipeline; migrations applied before rolling out server. Feature flag ensures safe rollout per institution.

## Architecture Validation & Completion

### Coherence & Coverage

- **Stack alignment:** Bun/Hono/tRPC + React SPA with Drizzle schema extensions stays coherent; no conflicting frameworks introduced.  
- **Patterns:** Naming/structure/communication rules align with existing conventions, ensuring AI agents don’t diverge.  
- **Structure:** Project tree explicitly maps FR categories to server modules, routers, and UI surfaces; promotion/logging boundaries stay intact.

### Requirements Support Check

- FR1–FR4: Eligibility service + admin UI.  
- FR5–FR8: Retake exam/session manager + student_exam_attempts + admin flows.  
- FR9–FR12: Teacher grade entry upgrades + TRPC endpoints.  
- FR13–FR16: Promotion recalculation hooks + dashboards/audit exports.  
- FR17–FR20: Policy config service + RBAC/feature flags.  
- NFRs (latency, audit, accessibility, rollout safety) addressed via schema design, logging, feature flags, and UI guidelines.

### Implementation Readiness

- Decisions, patterns, structure, and module mappings are all explicit.  
- Conflict points (naming, access control, data flow) have concrete guidance; AI agents have examples and anti-patterns.  
- Feature flag + migration sequencing defined for rollout safety.

### Validation Checklist

- ✅ Project context and constraints captured.  
- ✅ All critical decisions documented.  
- ✅ Implementation patterns & project structure defined.  
- ✅ Requirements mapped to modules/components.

### Handoff Notes

- **Status:** READY for implementation.  
- **First tasks:** Create migrations for `session_type`/`parent_exam_id`, `student_exam_attempts`, `retake_policies`, then build retake module services/routers followed by admin/teacher surfaces.  
- **Guidance:** AI agents should reference this architecture doc for every schema, service, router, and UI addition; fall back here before inventing new patterns.

## Architecture Completion & Handoff

**Summary for TKAMS Retake Architecture:**
- 7 steps completed with comprehensive context, starter, decisions, patterns, structure, and validation.
- All 20 FRs + NFRs mapped to concrete modules, schema changes, and UI flows.
- Implementation patterns and project structure ensure multiple AI agents can work in parallel without drifting.

**Next Steps for Implementation:**
1. Review `{planning_artifacts}/architecture.md` before each story.  
2. Build migrations (`session_type`, `parent_exam_id`, `student_exam_attempts`, `retake_policies`).  
3. Implement retake server module + TRPC router, then admin/teacher UI updates and promotion hooks.  
4. Keep feature flags on until deployments are validated per institution.

**Status:** READY FOR IMPLEMENTATION ✅  
**Handoff:** AI agents should follow every decision/pattern in this document; any deviation requires updating the architecture file.
