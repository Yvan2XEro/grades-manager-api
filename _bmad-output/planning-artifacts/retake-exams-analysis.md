# Retake (Rattrapage) Exams – Product & Domain Analysis

## Context
- Current system models a single exam instance per class-course; retake sessions are not represented.
- Promotion logic already tracks course attempts via `student_course_enrollments` and exposes retake-related facts (e.g., `retakeSuccessRate`), but exams/grades cannot distinguish attempts.
- Registrar workflows (docs/analyze.md, docs/guide/guide_sections/09_configuration.tex) expect normal and retake sessions per semester.

## Functional Requirements
1. **Eligibility**
   - Triggered when a course attempt ends `failed` or UE average drops below passing.
   - Must respect promotion metrics such as `creditDeficit`, `eliminatoryFailures`, `retakeSuccessRate`.
   - Support overrides for medical/jury cases and caps on simultaneous debts.
2. **Limits**
   - Default: 1 normal + 1 retake per course per academic year.
   - Track total attempts per student/course via `student_course_enrollments.attempt`; block new retakes when limit reached unless overridden.
3. **Scoring policies**
   - Replacement, Best-of, and Compensation-aware (apply only if it resolves a debt).
   - Policies can vary per course/program and must feed promotion facts correctly.
4. **Workflow**
   - Distinct semester sessions (Normal vs Retake).
   - Registrar selects eligible students, schedules retake exams, notifies teachers/students.
   - Teachers input retake grades in a dedicated context; grades remain locked once validated.

## Domain & Data Model Additions
1. **Exam Sessions & Parent Linkage**
   - Add `sessionType` + `parentExamId` (or new `exam_sessions` table) so retakes inherit base exam metadata while keeping their own schedule.
2. **Student Exam Attempts**
   - New `student_exam_attempts` table: `student_course_enrollment_id`, `exam_id`, `attempt_number`, `status`, metadata (presence, justification).
   - `grades` remain numeric results but attach to attempts to preserve history.
3. **Retake Policies**
   - `retake_policies` entity tied to programs/courses: eligibility thresholds, max attempts, scoring strategy, re-enrollment requirements.
4. **Grade & Ledger Updates**
   - Extend transcript + `student_credit_ledgers` recalculation to fire when retake grades validate.
   - Promotion facts service must recompute `retakeSuccessRate`, debts resolved, etc.
5. **Workflow Metadata**
   - Enrollment dashboards (per TODO) show outstanding retakes and outcomes.
   - Exports/templates render either both attempts or only the final mark depending on policy.

## MVP vs Post-Stabilization
### MVP
1. One retake session per semester (manual setup).
2. Policy choices limited to Replace vs Best-of; single retake per course/year.
3. Automatic eligibility list (failed attempts) with registrar override.
4. Retake grade entry through existing teacher workflow with retake flag; synchronous recalculation of UE averages + credit ledger.
5. UI updates for registrar scheduling, teacher grading, admin enrollment board to surface retake status.

### Post-Stabilization
1. Multiple retake waves + templated calendars with automated scheduling.
2. Fine-grained compensation rules per UE/exam component (e.g., oral retakes).
3. Student self-service sign-up, payments/tokens, integration with notifications & batch recalculation jobs.
4. Analytics dashboards for retake KPIs, debt resolution forecasting.
5. Cross-program/shared retake pools (currently out of scope).

## Open Questions
1. Can retake weights differ from the normal session (per exam component)?
2. Should promotion decisions re-run immediately per student or in batches once the retake session closes?
3. What evidence is required for eligibility overrides, and where should supporting documents live?
