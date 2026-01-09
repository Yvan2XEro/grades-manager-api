---
title: 'Determine retake eligibility for students after a failed exam'
slug: 'determine-retake-eligibility-for-students-after-a-failed-exam'
created: '2026-01-09T03:31:26+01:00'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - Bun runtime
  - TypeScript
  - tRPC
  - Drizzle ORM
  - PostgreSQL
files_to_modify:
  - apps/server/src/db/schema/app-schema.ts
  - apps/server/src/db/migrations/*retake-overrides*.sql
  - apps/server/src/modules/exams/exams.router.ts
  - apps/server/src/modules/exams/exams.service.ts
  - apps/server/src/modules/exams/exams.repo.ts
  - apps/server/src/modules/exams/__tests__/exams.caller.test.ts
  - apps/server/src/modules/student-course-enrollments/student-course-enrollments.service.ts
  - apps/server/src/modules/student-course-enrollments/student-course-enrollments.repo.ts
  - apps/server/src/modules/grades/grades.repo.ts
  - apps/server/src/config/index.ts
  - apps/server/src/config/retakes.ts
  - apps/server/.env.example
code_patterns:
  - Tenant-aware tRPC procedures (e.g., tenantAdminProcedure) gate admin routers.
  - Services wrap Drizzle repos, often via helper transactions and guards (assertEditable, ensureStudentRegistered).
  - Feature toggles live under apps/server/src/config with env fallbacks and helper accessors.
  - Domain modules colocate repos, services, routers, and tests (caller tests hitting router procedures).
test_patterns:
  - Bun test runner executes *.caller.test.ts to exercise routers via seeded test callers.
  - Tests set up fixtures through helpers in apps/server/src/lib/test-utils.ts.
  - HTTP-level behaviors validated in routers/__tests__ while module units use colocated caller tests.
---

# Tech-Spec: Determine retake eligibility for students after a failed exam

**Created:** 2026-01-09T03:31:26+01:00

## Overview

### Problem Statement

After an exam is approved there is no deterministic server-side computation that indicates which enrolled students are entitled to a retake. Registrars currently inspect grades and enrollment attempts manually, making it impossible for downstream stories (session creation, grading, promotion recalculation) to trust a canonical eligibility source while still respecting MVP constraints (single retake per course/year, failure-driven, registrar override friendly, no student-facing exposure).

### Solution

Add a feature-flagged backend eligibility service that runs once an exam reaches the approved state, evaluates grades and enrollment metadata to determine who failed/has insufficient outcomes, enforces the “one retake per course per academic year” rule, and layers in registrar overrides recorded in a dedicated `retake_overrides` audit table. The computed result is returned through the existing `admin.exams` router so admin tools can consume it, while persisting nothing beyond overrides for now.

### Scope

**In Scope:**
- Server-only logic to derive eligibility from approved exams, stored grades, and `student_course_enrollments`.
- Introduce a `retake_overrides` table + repo/service APIs so registrars can force include/exclude specific students with reason + audit metadata.
- Feature flag (`RETAKES_FEATURE_FLAG`) gating to short-circuit the API when disabled.
- Extend the admin exams router with an eligibility listing endpoint that surfaces computed rows plus override metadata, but no UI work.

**Out of Scope:**
- Creating retake sessions, attempts, or scheduling workflows.
- Promotion recalculation changes, grading pipelines, or ledger recomputation.
- Student-facing APIs/UX, batch jobs, analytics, or new retake persistence like `student_exam_attempts`.
- Any UI changes or new routers beyond extending the existing `admin.exams` surface.

## Context for Development

### Codebase Patterns

- Exams finalize via `apps/server/src/modules/exams/exams.service.ts` by transitioning to `status === "approved"`; this is the trigger for eligibility computation, independent of `setLock`.
- Module layout is consistent: `*.repo.ts` encapsulate Drizzle queries, `*.service.ts` hold orchestration/guards, and routers rely on `tenantAdminProcedure` to enforce institution scoping.
- Grades live in `apps/server/src/modules/grades` and rely on `student-course-enrollments.service` to guarantee roster membership; leverage repo helpers instead of bespoke SQL to avoid duplicating guard logic.
- Feature toggles are centralized under `apps/server/src/config` with env-backed helpers; add `retakesConfig` to expose `RETAKES_FEATURE_FLAG` and reuse across routers/services.
- Audit-friendly tables (e.g., ledger, enrollments) stick to `app-schema` definitions + migrations; new tables land in migrations + `app-schema` simultaneously for Drizzle typing.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| apps/server/src/modules/exams/exams.service.ts | Source of approval events/status checks; provides existing guards and data fetching helpers. |
| apps/server/src/modules/exams/exams.router.ts | Entry point for admin exams procedures; extend with `listRetakeEligibility`. |
| apps/server/src/modules/grades/grades.repo.ts | Fetch grades per exam/student to evaluate fail outcomes without duplicating SQL. |
| apps/server/src/modules/student-course-enrollments/student-course-enrollments.service.ts | Exposes attempts/year metadata and roster validation to enforce one-retake-per-course. |
| apps/server/src/modules/student-course-enrollments/student-course-enrollments.repo.ts | Provides raw query helpers for course attempts/history; useful for runtime computation. |
| apps/server/src/config/index.ts & new config/retakes.ts | Add `RETAKES_FEATURE_FLAG`, export typed getter for routers/services. |
| apps/server/src/db/schema/app-schema.ts + new migration | Define the `retake_overrides` table (exam/enrollment/decision/reason/audit columns). |
| apps/server/src/modules/exams/__tests__/exams.caller.test.ts | Extend caller tests to cover feature-flag gating + eligibility logic. |

### Technical Decisions

- Runtime eligibility only: compute per request using existing tables; persistence deferred until retake sessions and attempts exist.
- Dedicated `retake_overrides` table stores manual registrar decisions with audit metadata (decision, reason, actor, timestamp, institution).
- Eligibility endpoint returns `{ enabled: boolean, items: RetakeEligibilityRow[] }`; when feature-flag off, respond with `enabled:false` and an empty items array to keep clients stable.
- Router surface: extend `admin.exams` with `listRetakeEligibility` plus override mutations so MVP fits neatly beside other exam admin procedures; defer standalone router until feature matures.
- Computation enforces “approved exam only” gating and ensures per-student course attempts don’t exceed one retake per academic year by reading `attempt` + `academicYearId` from enrollments.

## Implementation Plan

### Tasks

- [ ] Task 1: Add feature flag plumbing for retakes
  - File: `apps/server/src/config/index.ts`, `apps/server/src/config/retakes.ts`, `.env.example`
  - Action: Introduce `RETAKES_FEATURE_FLAG` env variable, load it in config, and expose a typed helper (e.g., `isRetakesEnabled(institutionId)` or boolean accessor). Document default behavior and ensure tenant-aware configs can read it.
  - Notes: Keep consistent with existing config modules (export object with getters). Update `.env.example` so deployers know to set the flag.
- [ ] Task 2: Create `retake_overrides` table via migration + schema
  - File: `apps/server/src/db/schema/app-schema.ts`, new migration file under `apps/server/src/db/migrations`
  - Action: Define table with columns: `id` (uuid), `examId` FK, `studentCourseEnrollmentId` FK, `decision` enum (`force_eligible`/`force_ineligible`), `reason` text, `createdBy` FK (domain user), `createdAt` timestamp default now, `institutionId`. Add composite unique constraint on (`examId`, `studentCourseEnrollmentId`). Generate migration reflecting schema.
  - Notes: Ensure foreign keys cascade appropriately and indexes exist for exam + enrollment lookups.
- [ ] Task 3: Implement repository + service helpers for overrides
  - File: `apps/server/src/modules/exams/exams.repo.ts` (or dedicated sub-module), new file `apps/server/src/modules/exams/retake-overrides.repo.ts` if preferred
  - Action: Add repo functions to upsert/delete overrides, list overrides by exam, and fetch override map keyed by enrollment. Service layer should validate institution ownership and actor permissions.
  - Notes: Keep logic colocated with exams module to avoid premature module splitting.
- [ ] Task 4: Build eligibility computation service
  - File: `apps/server/src/modules/exams/exams.service.ts`, possibly helper file `retake-eligibility.service.ts`
  - Action: Implement function `listRetakeEligibility(examId, institutionId)` that:
    - Validates exam exists and `status === "approved"`
    - Loads enrollments/grades for the class course + academic year
    - Determines failing outcomes (no grade, insufficient score, enrollment status failed)
    - Enforces max one retake per course per academic year by checking enrollment attempts (attempt > 1 already consumed)
    - Incorporates overrides: `force_eligible` always included, `force_ineligible` always excluded (even if failing)
    - Returns deterministic rows with reason codes (e.g., FAILED_EXAM, OVERRIDE_INCLUDE, OVERRIDE_EXCLUDE)
  - Notes: Reuse repos where possible; avoid N+1 queries by batching grade/enrollment fetches.
- [ ] Task 5: Expose admin router procedures
  - File: `apps/server/src/modules/exams/exams.router.ts`
  - Action: Add `admin.exams.listRetakeEligibility` procedure (tenant admin only) that checks feature flag; when disabled, return `{ enabled: false, items: [] }`. When enabled, call the service, return `{ enabled: true, items, overrides }`. Add mutations for setting/removing overrides with validation.
  - Notes: Input schema should accept `examId`, optional override payload. Ensure TRPC errors mirror existing patterns.
- [ ] Task 6: Update tests
  - File: `apps/server/src/modules/exams/__tests__/exams.caller.test.ts`
  - Action: Add caller tests covering: feature flag disabled returns empty; enabled scenario computing eligibility with fixture data (failed grade, attempt counts); override behavior (force include/exclude). Seed necessary data via `test-utils`.
  - Notes: Include edge cases like exam not approved (expect BAD_REQUEST) and attempt limit reached.
- [ ] Task 7: Wire supporting repos/services
  - File: `apps/server/src/modules/grades/grades.repo.ts`, `apps/server/src/modules/student-course-enrollments/student-course-enrollments.repo.ts`
  - Action: Add query helpers to fetch grades per exam as maps, and to fetch enrollment attempts scoped to exam’s course/year to check retake counts efficiently.
  - Notes: Keep functions generic for reuse later (e.g., `listByClassCourseWithAttempts`).

### Acceptance Criteria

- [ ] AC1: Given an approved exam with failing students and feature flag enabled, when the registrar calls `admin.exams.listRetakeEligibility`, then the response returns `enabled: true` with each eligible student listed along with reason codes and override metadata.
- [ ] AC2: Given an exam that is not approved, when `admin.exams.listRetakeEligibility` is called, then the service rejects the request with a BAD_REQUEST error indicating the exam is not finalized.
- [ ] AC3: Given the feature flag is disabled, when `admin.exams.listRetakeEligibility` is called, then the router returns `enabled: false` and an empty items array without touching the database.
- [ ] AC4: Given a student has already consumed the single retake attempt for the course in the academic year, when eligibility is requested, then that student is excluded unless a `force_eligible` override exists.
- [ ] AC5: Given overrides exist, when eligibility is computed, then `force_ineligible` entries suppress otherwise eligible students and `force_eligible` entries include students even if they do not meet grade-based criteria, with the override reason reflected in the response.
- [ ] AC6: Given registrar submits an override mutation, when the request succeeds, then the override is persisted in `retake_overrides` with audit metadata and subsequent eligibility calls reflect the change.

## Additional Context

### Dependencies

- Existing exams, grades, and student-course-enrollments modules (no new external services).
- New database migration must run before enabling the feature flag.
- Feature flag relies on environment configuration propagated to the server runtime.

### Testing Strategy

- Unit/Integration: Use Bun caller tests for `admin.exams` procedures to cover eligibility computation, feature flag gating, and override mutations.
- Database: Migration tests ensured via drizzle migration pipeline; optional smoke test to confirm table exists.
- Manual: (future) Once UI consumes API, verify admin console fetch respects flag and reason codes, but MVP scope doesn't require manual UI validation.

### Notes

- Risk: Eligibility computation could become heavy for large rosters; ensure queries batch by class course rather than per student.
- Risk: Override table must enforce uniqueness to prevent multiple conflicting entries per student/exam.
- Future work: Retake session creation will likely reuse eligibility service; consider designing response shape for forward compatibility (include enrollment IDs, class course references).
