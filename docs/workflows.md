# Workflows Snapshot (Phase 2)

## Students
- Enroll via admissions or manual seeding — creation now inserts a domain profile + `enrollments` row linking the class and academic year.
- Transfer between classes: `classes.transferStudent` closes the active enrollment and opens a new one so the history table reflects every move.
- View consolidated grades: `grades.getStudentTranscript` aggregates results per UE (using course credits) and exposes the overall weighted average.

## Teachers
- Manage courses within their UE: they can request new class assignments only if prerequisites are already assigned (`classCourses` validation).
- Schedule assessments: `exams.create` registers a draft exam, `exams.submit` forwards it to the dean, and once approved they can upload scores via the CSV import endpoint.
- Export current grades for reconciliation using `grades.exportClassCourseCsv`.

## Deans / Administrators
- Approve exams via `exams.validate` and lock them once the grades are finalized.
- Monitor teaching units, prerequisites, and enrollments via the new routers (`teachingUnits`, `enrollments`) to keep the catalog clean.
- Rely on the `enrollments` history when decommissioning classes (`classes.delete` migrates students forward before removal).

# Phase 3 extensions

- Grade validation is now orchestrated through the `workflows.validateGrades` TRPC endpoint, which approves and locks submitted
  exams while dispatching notifications.
- Enrollment windows can be opened or closed per class/year using `workflows.enrollmentWindow`, with history stored in the
  `enrollment_windows` table.
- Attendance alerts are queued with `workflows.attendanceAlert` and surfaced through the notifications module.
