# Atomic Course Enrollment & Cycle Hierarchy

This document explains how to extend the current academic model (see `docs/architecture.md`) so that:

1. Student enrollment into subjects is fully atomic and students can advance to the next level after reaching a credit threshold while still retaking failed courses.
2. Study cycles (e.g., Bachelor, Master) sit above programs in the hierarchy, unlocking long-term planning and level-aware rules.

Both capabilities require coordinated updates across the database schema, the `apps/server` modules, migrations, and fixtures/tests.

---

## Current State (Phase 0)

- **Programs, classes, courses** – `programs` belong to a faculty, and `classes` are academic-year specific cohorts for a program (`apps/server/src/db/schema/app-schema.ts`). `class_courses` assigns every course offering to a class/teacher, so the system implicitly assumes every student in a class takes the full class course bundle.
- **Enrollments** – `enrollments` track `student ↔ class ↔ academic_year` (`apps/server/src/modules/enrollments`). Promotion equals switching the student’s `class` and closing the previous enrollment.
- **Transcripts/credits** – `grades.getStudentTranscript` aggregates scores per course/teaching unit but there is no storage that counts credits earned over time or per attempt.
- **Hierarchy ceiling** – Faculties group programs, but there is no notion of study cycle or level. `classes` hold only a `name`, so the API cannot infer whether a class is “Bachelor 2” or “Master 1”.

This layout blocks individualized retakes and cycle-aware workflows.

---

## Goals & Principles

1. **Atomic course enrollment**
	- Track every student-course attempt independently of their primary class.
	- Allow retaking a course with a different cohort without duplicating the student record.
	- Keep audit history (status, attempt number, credits earned, timestamps).
	- Enforce that exams/grades only apply when a student is registered for the course offering.
2. **Cycle hierarchy**
	- Model study cycles (Bachelor, Master, Doctorate, etc.) and the ordered levels within each cycle.
	- Attach programs to a cycle-level sequence so that credit thresholds and promotion rules can be computed centrally.
	- Keep `classes` as the cohort construct (program × academic year) but tag each class with the level it represents.
3. **Backward compatibility**
	- Provide migrations/backfills so existing faculties/programs/classes remain valid and tests keep passing.
	- Avoid breaking caller contracts by releasing incremental API changes (new routers or versioned procedures).

---

## Feature 1 – Student-Level Course Enrollment

### Data Model Changes

1. **`student_course_enrollments` table**
	```sql
	create table student_course_enrollments (
		id text primary key default gen_random_uuid(),
		student_id text not null references students(id) on delete cascade,
		class_course_id text not null references class_courses(id) on delete cascade,
		course_id text not null references courses(id) on delete cascade,
		source_class_id text not null references classes(id) on delete restrict,
		academic_year_id text not null references academic_years(id) on delete restrict,
		status text not null check (status in ('planned','active','completed','failed','withdrawn')),
		attempt integer not null default 1,
		credits_attempted integer not null,
		credits_earned integer not null default 0,
		started_at timestamptz default now(),
		completed_at timestamptz,
		unique(student_id, course_id, academic_year_id, attempt)
	);
	```
	- `class_course_id` identifies the actual course offering (class + teacher) used for scheduling exams.
	- `source_class_id` allows a student to register for a previous class’ course even if their current `students.class` points to a more advanced cohort.
- `credits_attempted` copies `teaching_units.credits` to preserve history even if the catalog changes later.
2. **`student_credit_ledger` view/table (optional but recommended)**
	- Either materialized view or table maintained by triggers.
	- Fields: `student_id`, `academic_year_id`, `cycle_level_id` (after hierarchy work), `credits_earned`, `credits_in_progress`.
	- Powers promotion logic and analytics without recalculating transcripts on every request. ✅ `student_credit_ledgers` now exists with default `required_credits = 60` so totals stay in sync even before cycles/levels arrive.
3. **Foreign key adjustments**
	- Keep `grades.exam → exams.id` but augment `grades` inserts to verify that `(student_id, exam.class_course)` matches an active row in `student_course_enrollments`.
	- `students.class` stays as the “primary cohort” pointer for UI/backoffice screens.

### Repository & Service Updates

1. **New module** `apps/server/src/modules/student-course-enrollments`
	- Router: `list`, `create`, `updateStatus`, `closeAllForStudent`, `bulkEnroll`.
	- Validations:
		- Ensure `class_course` belongs to the same program as the student. Retakes must still target offerings originating from the student’s home program; cross-program enrollments are out of scope.
		- Enforce prerequisites using existing `courses` prerequisite graph.
		- Deny duplicate active rows per `(student_id, course_id)` when status is `active/planned`.
	- When status transitions to `completed` or `failed`, compute `credits_earned` (0 when failed, `credits_attempted` when passed) and update the ledger.
2. **`exams`/`grades` modules**
	- Before scheduling exams, determine roster by querying `student_course_enrollments` for the related `class_course`. Optionally store `exam_roster_snapshot` for auditing.
	- Grade mutations verify there is an `active` or `completed` enrollment for the pair.
3. **`students` module**
	- On transfer/promotion, keep existing `student_course_enrollments` rows untouched so in-progress retakes remain associated with the original offering.
	- Provide helper to enroll the student into all default class courses when they first join a cohort (mirrors current behavior). This helper simply bulk-creates `student_course_enrollments` rows instead of relying on implicit membership.
4. **`enrollments` module**
	- Continue storing `student ↔ class ↔ academic_year` but extend `enrollments.service.closeActiveEnrollment` to also close any lingering `student_course_enrollments` rows if the class has ended and the course is not offered anymore.

### Promotion & Credit Checks

- Introduce utility `calculateEligibleLevels(studentId)` that:
	1. Aggregates `credits_earned` per level.
	2. Compares totals with level requirements (defined in the cycle section).
	3. Returns the highest level unlocked while listing deficits for pending courses.
- Promotion workflow can then:
	- Close the current `enrollment` (`status = completed`).
	- Assign the student to the next class (same program, higher level).
	- Auto-enroll them in the new class’ courses plus any failed courses flagged as requirements to retake.

### Migration & Backfill

1. Add migrations for the new tables/indexes.
2. Backfill script (Bun task) to:
	- Iterate over every active `student`.
	- Fetch their current `class` and all `class_courses` linked to that class.
- Insert `student_course_enrollments` rows with `status = 'active'`, `attempt = 1`, `credits_attempted = teaching_units.credits`, `source_class_id = class.id`, `academic_year_id = class.academicYear`.
	- For completed grades (students with `enrollments.status = completed`), set `status = 'completed'` and `credits_earned = credits_attempted`.
	- For missing grades, keep `status = 'active'`.
3. Update factories in `apps/server/src/lib/test-utils.ts` to create the new rows as part of `createRecapFixture`.

### Testing

- Extend the existing Bun test suites:
	- `modules/enrollments` → ensure promotion leaves retake enrollments open.
	- `modules/grades` → cover the guard that prevents grading when no active enrollment exists.
	- New `student-course-enrollments` tests verifying prerequisites, duplicate prevention, roster sync, and retake flows.
- Update `grades.getStudentTranscript` tests to confirm the new ledger mirrors transcript aggregates.

---

## Feature 2 – Cycle (Curriculum) Hierarchy

### Data Model

1. **`study_cycles` table**
	```sql
	create table study_cycles (
		id text primary key default gen_random_uuid(),
		faculty_id text not null references faculties(id) on delete cascade,
		code text not null,
		name text not null,
		description text,
		total_credits_required integer not null,
		duration_years integer not null,
		unique(faculty_id, code)
	);
	```
2. **`cycle_levels` table**
	```sql
	create table cycle_levels (
		id text primary key default gen_random_uuid(),
		cycle_id text not null references study_cycles(id) on delete cascade,
		order_index integer not null,
		code text not null,
		name text not null,
		min_credits integer not null,
		unique(cycle_id, code),
		unique(cycle_id, order_index)
	);
	```
	- `min_credits` expresses how many credits are required to unlock the subsequent level. Default to 60 credits per level (30 per semester) but let faculties override this per level.
3. **`programs` adjustments**
	- Add `cycle_id` FK (non-null for new programs).
	- Optional `default_level_span` column describing how many levels the program covers (for cases where a program is scoped to a subset of the cycle).
4. **`classes` adjustments**
	- Add `cycle_level_id` FK. This lets reporting/filtering answer “show all Master 1 classes”.
	- Add computed constraint ensuring the class’ `program` belongs to the same cycle as the referenced level.
	- Because each faculty controls its own cycles, scope level creation to the program’s faculty to avoid cross-faculty contamination.

### API & Module Changes

1. **New `cycles` module**
	- Router exposing CRUD for `study_cycles`, nested `cycle_levels`, and helper queries (list cycles per faculty, fetch ordered levels).
	- Access control: limit creation/updating to administrators/deans (same guard style as `faculties`).
2. **`programs` module**
	- Update zod schemas to accept `cycleId`.
	- Add filters (`listPrograms` can now filter by `cycleId` or `cycleLevelId`).
	- Update repository joins to include cycle metadata for UI.
3. **`classes` module**
	- Require `cycleLevelId` when creating/updating classes.
	- Validate that the provided level belongs to the program’s cycle.
	- Extend filters so callers can fetch classes by cycle/level.
4. **`enrollments` module**
	- Surface the class’ `cycleLevelId` in list/detail responses to simplify downstream calculation of eligibility.
5. **`student_course_enrollments` ledger integration**
	- Store the level derived from the class/course offering so credits can be rolled up per level.

### Migration & Backfill

1. Create cycles for existing programs:
	- Decide default mapping (e.g., `Bachelor` = cycle with three levels L1–L3, `Master` = cycle with two levels M1–M2). A script can infer this from program naming conventions or accept a seed JSON file.
	- For every existing program:
		- Create/find the appropriate `study_cycle`.
		- Assign `cycle_id`.
		- For each class name (often contains level info) create `cycle_levels` rows and map classes to those IDs. When names are ambiguous, default to level order 1..n and flag for manual review.
2. Update factories/seeds so `createProgram` optionally accepts a `cycleId`, and `createClass` defaults to `cycleLevelId`.
3. Regenerate type helpers after schema updates (`bun run --filter server db:generate` + `bun run check`).

### User Flows Enabled

- **Planning** – Admin can list all programs under “Master” and view how many credits are required at each level.
- **Promotion** – When checking eligibility, fetch the student’s current `cycleLevelId`, compare ledger credits against `cycle_levels.min_credits`, and determine if they can move to the level referenced by the target class.
- **Reporting** – Filter transcripts, class rosters, or exams by cycle/level for aggregated analytics.

---

## Cross-Cutting Concerns

- **Authorization** – Mirror the RBAC approach used in `modules/faculties`: only administrators/deans may mutate cycles or bulk-enroll students into courses. Teachers can list `student_course_enrollments` for their own `class_courses`.
- **Validation layer** – Update `apps/server/src/modules/_shared/validators` (if/when introduced) to centralize checks (credit totals, prerequisite completion).
- **Docs & Onboarding** – Extend `docs/architecture.md` with diagrams showing `study_cycles → programs → classes → class_courses → student_course_enrollments`. Document promotion workflows and ledger usage so future contributors understand the invariants.
- **Front-end alignment** – The React shell should be updated to surface cycle tags and to enroll students per course, but that work can land after the API because tRPC contracts will stay backward compatible by adding optional fields first.
- **Decision rules** – Promotion eligibility, credit thresholds, and future retake caps should be expressed through `json-rules-engine`. Plan a dedicated admin interface to edit rule documents per faculty/cycle so policy tweaking does not require deployments.
- **Current status** – The backend now seeds a default promotion rule (eligible when `creditsEarned >= requiredCredits`) using `json-rules-engine` and exposes helper services so once the UI surfaces the ledger snapshot, admins can inspect and eventually edit faculty-specific rules.
- **Admin UX** – Back-office needs: (1) a Study Cycle catalog (filter by faculty, CRUD cycles, show linked programs/classes); (2) a Cycle Level editor (list/reorder levels, edit min-credit thresholds, warn when programs reference a level); (3) a Promotion Rule screen fed by `json-rules-engine` where admins preview defaults, clone them per faculty, and stage overrides with comments; and (4) a Course Enrollment board that combines ledger totals, outstanding retakes, and manual overrides. Capture these flows, strings, and permissions in `apps/web` so the new tRPC endpoints land with clear UI contracts.

---

## Open Questions

1. **Cycle catalog** – Each faculty defines and maintains its own cycles; sharing is optional but not required.
2. **Credit thresholds** – Default to 60 credits per level (30 per semester) yet expose overrides per level/cycle so faculties or programs can diverge.
3. **Retake rules** – Keep `attempt` counters but postpone enforcement until a configurable rule set is defined; `json-rules-engine` will eventually drive this.
4. **Cross-program retakes** – Students may only enroll in courses belonging to their program; cross-program retakes remain unsupported.
5. **Ledger refresh cadence** – Accept eventual consistency; admins or cron jobs can rebuild credit ledgers, synchronous recalculation is not mandatory for the first release.

Future iterations should encode these resolved policies in shared rule documents managed via `json-rules-engine` interfaces.
