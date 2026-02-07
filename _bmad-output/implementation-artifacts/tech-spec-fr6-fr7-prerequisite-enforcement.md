---
title: 'FR6/FR7 prerequisite enforcement telemetry'
slug: 'fr6-fr7-prerequisite-enforcement'
created: '2026-01-07T00:48:54.152601'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript', 'Bun', 'tRPC', 'Drizzle ORM']
files_to_modify: [
	'apps/server/src/db/schema/app-schema.ts',
	'apps/server/src/modules/student-course-enrollments/student-course-enrollments.service.ts',
	'apps/server/src/modules/student-course-enrollments/student-course-enrollments.repo.ts',
	'apps/server/src/modules/student-course-enrollments/student-course-enrollments.router.ts',
	'apps/server/src/modules/student-course-enrollments/__tests__/student-course-enrollments.caller.test.ts'
]
code_patterns: [
	'Services enforce business rules before delegating to repos (student-course-enrollments.service)',
	'Routers use tRPC callers keyed by role with Bun test harness in __tests__ folders',
	'Schema modeled with Drizzle pgTable definitions shared across modules'
]
test_patterns: [
	'Bun test with appRouter caller to exercise TRPC procedures end-to-end',
	'Fixtures created via lib/test-utils helpers like createRecapFixture'
]
---

# Tech-Spec: FR6/FR7 prerequisite enforcement telemetry

**Created:** 2026-01-07T00:48:54.152601

## Overview

### Problem Statement

Enrollment APIs never evaluate per-student prerequisites, so registrars can push through enrollments without visibility into missing mandatory or recommended requirements defined in docs/analyze.md. This erodes trust in the stabilization release.

### Solution

Extend backend enrollment flows to store prereq types, evaluate satisfaction based on finalized statuses, and return structured warnings when mandatory or recommended requirements aren’t satisfied or still in progress. Enrollment always proceeds but carries violation metadata for auditing and future UX.

### Scope

**In Scope:**
- Schema updates for coursePrerequisites to store type flag
- Enrollment repo/service logic to evaluate prerequisites per student and emit warnings
- Structured warning payload in routers/tests
- Coverage for bulk and single enrollment flows

**Out of Scope:**
- Student self-service UI
- Analytics/reporting layers
- Batch jobs or schedulers
- Hard-blocking policies or redesigned flows

## Context for Development

### Codebase Patterns

Existing class-course creation enforces prereq assignments up front, but student-course enrollment services only validate program alignment, attempts, and credit deltas. The student-course stack follows service/repo separation with Drizzle queries, TRPC routers under `apps/server/src/routers`, and Bun-based tests that drive the router via callers. Schema artifacts live in `app-schema.ts` and are referenced everywhere else, so the prereq type flag must originate there before services can read it.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| docs/analyze.md | Business rules for FR6/FR7 and prereq semantics |
| apps/server/src/db/schema/app-schema.ts | `coursePrerequisites` table definition and enums |
| apps/server/src/modules/student-course-enrollments/student-course-enrollments.service.ts | Enrollment orchestration + validation |
| apps/server/src/modules/student-course-enrollments/student-course-enrollments.repo.ts | Persistence helpers and list queries |
| apps/server/src/modules/student-course-enrollments/student-course-enrollments.router.ts | TRPC procedures returning payloads/warnings |
| apps/server/src/modules/class-courses/class-courses.service.ts | Current prereq enforcement at assignment time |
| apps/server/src/modules/student-course-enrollments/__tests__/student-course-enrollments.caller.test.ts | Bun tests covering router flows |

### Technical Decisions

- Use enum/string literal column for prereq type (“mandatory”/“recommended”) anchored in `app-schema.ts`
- Prefer non-blocking validations with structured warnings returned by services/routers; TRPC errors remain for true conflicts only
- Track satisfied statuses via reusable constants so business logic and tests share the same definition (e.g., `FINAL_STATUSES` or a new `SATISFIED_STATUSES`)
- Preserve existing repo/service boundaries: schema-change → repo exposure → service evaluation → router payload

## Implementation Plan

### Tasks

- [ ] Task 1: Add prereq type flag to schema and data layer
  - File: `apps/server/src/db/schema/app-schema.ts`
  - Action: Extend `coursePrerequisites` table with a `type` column (`mandatory`/`recommended`) and export a matching TypeScript union for reuse.
  - Notes: Ensure unique constraints/indexes stay intact and existing inserts default to `mandatory`.

- [ ] Task 2: Surface prereq types in repos
  - File: `apps/server/src/modules/student-course-enrollments/student-course-enrollments.repo.ts`
  - Action: Add helper query to fetch prerequisites (including type) for a target course and stats on student completion history; reuse Drizzle query builders.
  - Notes: Keep repo methods pure; no business logic here.

- [ ] Task 3: Implement prereq evaluation service
  - File: `apps/server/src/modules/student-course-enrollments/student-course-enrollments.service.ts`
  - Action: Before inserting enrollments (single, bulk, auto), load prerequisite graph, cross-check against student course history, and build a warnings array describing unmet mandatory, recommended, or in-progress requisites. Persist enrollment regardless, but include warnings in returned payloads.
  - Notes: Define `SATISFIED_STATUSES` constant (e.g., `["completed", "validated", "passed"]`) and treat in-progress as “co-requisite” warnings.

- [ ] Task 4: Update router contracts to expose warnings
  - File: `apps/server/src/modules/student-course-enrollments/student-course-enrollments.router.ts`
  - Action: Adjust procedure outputs to wrap service responses (created/skipped arrays) alongside warning metadata; ensure TRPC types reflect the new structure for create/bulk/auto enroll APIs.
  - Notes: Maintain backwards-compatible fields where possible; document warning shape.

- [ ] Task 5: Expand test coverage for warnings
  - File: `apps/server/src/modules/student-course-enrollments/__tests__/student-course-enrollments.caller.test.ts`
  - Action: Add scenarios covering mandatory violation, recommended violation, and in-progress co-requisite cases to ensure warnings are emitted without blocking enrollment.
  - Notes: Use `createRecapFixture` + custom prereq setup to keep fixtures deterministic.

### Acceptance Criteria

- [ ] AC1: Given a student lacking a mandatory prereq, when an admin enrolls them via `studentCourseEnrollments.create`, then the response contains the enrollment record plus a warning entry describing the missing course/type.
- [ ] AC2: Given a student with recommended prereqs unmet, when bulk enrollment runs, then `result.created` includes warnings referencing recommended gaps while still creating records.
- [ ] AC3: Given a student actively enrolled (status `active`) in a prereq during the same semester, when auto-enrolling the class, then the response flags the co-requisite as “in progress” but does not skip creation.
- [ ] AC4: Given all prereqs satisfied with finalized statuses, when performing any enrollment action, then the warnings array is empty.
- [ ] AC5: Given schema migrations executed, when inspecting `course_prerequisites`, then records store a `type` column defaulting to `mandatory`.

## Additional Context

### Dependencies

- Existing enrollment services and TRPC router contracts
- Docs/analyze.md business rules describing FR6/FR7
- Database migration process via Drizzle to add the new column

### Testing Strategy

- Bun unit/integration tests in `student-course-enrollments.caller.test.ts` to cover create/bulk/auto flows
- Potential repo-level tests for the new prerequisite query if needed
- Manual verification via TRPC caller in dev console to inspect warning payloads

### Notes

- Non-blocking enforcement means downstream consumers must handle warnings gracefully; spec documents payload now for frontend readiness
- Future blocking behavior can reuse the warning evaluation results as hard guards without rework
