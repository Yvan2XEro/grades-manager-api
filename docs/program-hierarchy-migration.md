# Program Hierarchy Migration Plan

This document describes how to reshape the academic hierarchy so it cleanly follows **Faculty → Program (filière) → Option/Track → Level**. The goal is to remove partial solutions (program‐per‐cycle, inferred options, unused columns) and keep the v1 model crisp.

---

## 1. Backend / Database

1. **Detach programs from study cycles**
   - Drop the mandatory `cycle_id` on `programs` (make nullable, backfill, then remove).
   - Programs remain attached only to a faculty; cycle information will live elsewhere.

2. **Introduce program options**
   - New table `program_options` (`id`, `program_id` FK, `name`, `code`, `description`, timestamps).
   - Optional field `cycle_level_id` if you want each option bound to a specific level; otherwise classes will carry the level reference.

3. **Refine classes**
   - `classes` now store `program_id`, `program_option_id`, `cycle_level_id`, `academic_year_id`.
   - Add FK constraints + checks to ensure the option belongs to the class program and level lives in the same cycle.

4. **Update modules**
   - Add a `program-options` module (repo/service/router) for CRUD + list.
   - Update `programs`, `classes`, `enrollments`, `student_course_enrollments`, etc., to carry/return the new fields.
   - Add validation/tests for option/level consistency.

5. **Migration steps**
   - Create default options for every existing program (“Default option”), capture their IDs.
   - Backfill `classes.program_option_id` with the default option ID per program.
   - Once populated, remove the old `programs.cycle_id`.

---

## 2. Frontend

1. **Program management**
   - Remove the “cycle” select from the program form; a program only chooses a faculty.
   - Add an “Options” management UI (list + create/delete) per program.

2. **Class form**
   - Require Program → Option → Level → Academic year.
   - Filter options by program, and levels by the option’s cycle (or by the program’s cycle levels).
   - Display cycle/option badges in the class table.

3. **Enrollment & dashboards**
   - Everywhere classes appear (admin enrollment filters, teacher/student dashboards, exports), include option + level labels from the API response.

4. **Courses/Teaching Units**
   - When selecting a program, show its cycle info and (if relevant) allow picking an option if the course/UE is option-specific.

5. **Translations / typing**
   - Add the new labels (“Program option”, “Cycle / option”) to locale files, then run `bun run --cwd apps/web i18n:gen`.

---

## 3. Resulting Model

```
Faculty ──┐
          ├─ Program (filière) ──┐
          │                      ├─ Program Option (track)
          │                      │     └─ Classes tied to cycle levels
          │                      └─ ... (more options)
```

Classes and enrollments now carry explicit references to both the option and the level, so there is no need to duplicate programs per cycle or to guess the student’s track from a label. This keeps the schema minimal, readable, and aligned with higher-education structures.***
