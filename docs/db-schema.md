# Drizzle Schema Reference (Business Tables)

## `faculties`
- Represents a faculty/school inside the institution.
- Columns: `id`, `name` (unique), optional `description`, timestamps.
- Connected to many `programs`.

## `programs`
- Academic programs offered by a faculty (e.g., Bachelor of CS).
- Columns: `id`, `name`, optional `description`, `faculty_id`, timestamps.
- One-to-many relationship to `classes`, `courses`, and `teaching_units`.

## `academic_years`
- Defines official academic sessions (e.g., 2024–2025).
- Columns: `id`, `name`, `start_date`, `end_date`, `is_active`, timestamps.
- Referenced by `classes` and `enrollments`.

## `classes`
- Cohort/group inside a program for a given academic year.
- Columns: `id`, `name`, `program_id`, `academic_year_id`, timestamps.
- Has many `class_courses`, `students`, and `enrollments`.

## `teaching_units`
- UE/Module layer grouping courses within a program.
- Columns: `id`, `program_id`, `name`, `code`, optional `description`, `credits`, `semester` (`fall`/`spring`/`annual`), timestamps.
- Each teaching unit owns multiple `courses`.

## `courses`
- Individual ECs tied to both a program and a teaching unit.
- Columns: `id`, `name`, `credits`, `hours`, `program_id`, `teaching_unit_id`, `default_teacher_id`, timestamps.
- Linked to `class_courses`, `course_prerequisites`, and exams via class-course assignments.

## `course_prerequisites`
- Explicit prerequisite graph for courses.
- Columns: `id`, `course_id`, `prerequisite_course_id`, timestamp.
- Enforced so a class cannot receive an EC before its prerequisites are scheduled.

## `class_courses`
- Assignment of a course to a specific class with a teacher.
- Columns: `id`, `class_id`, `course_id`, `teacher_id`, `weekly_hours`, timestamps.
- Source of truth for scheduling exams (`exams.class_course_id`).

## `exams`
- Assessments planned for a class-course.
- Columns: `id`, `name`, `type`, `date`, `percentage`, `class_course_id`, `is_locked`, `status` (`draft`/`scheduled`/`submitted`/`approved`/`rejected`), `scheduled_by`, `validated_by`, `scheduled_at`, `validated_at`, timestamps.
- Grading is only allowed when status is `approved` and the record is unlocked.

## `domain_users`
- Business profiles (students, teachers, admins) decoupled from Better Auth accounts.
- Columns: `id`, optional `auth_user_id`, `business_role`, identity fields (names, email), contact info, `date_of_birth`, `place_of_birth`, `gender`, `nationality`, `status`, timestamps.
- Referenced by `students` (and later staff tables) plus exams for `scheduled_by`/`validated_by`.

## `students`
- Student registry pointing to a domain profile.
- Columns: `id`, `domain_user_id`, unique `registration_number`, current `class_id`, timestamps.
- Linked to grades and enrollment history.

## `enrollments`
- Historical log of where/when a student studied.
- Columns: `id`, `student_id`, `class_id`, `academic_year_id`, `status` (`pending`/`active`/`completed`/`withdrawn`), `enrolled_at`, `exited_at`.
- Updated automatically on transfers or deletions to preserve audits.

## `grades`
- Scores for a student in a specific exam.
- Columns: `id`, `student_id`, `exam_id`, `score`, timestamps.
- Used for weighted averages, CSV exports, and transcript consolidation.
