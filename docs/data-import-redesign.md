# Data import redesign — guided import per academic year

Status: phase 1 done (hub, foundation steps, step wizard). Phase 2 next.

## Problems with the current `/import`
- 4 unordered tabs (structure, people, enrollments, grades): template → upload → counts → run → redirect to the batch job page. No academic-year context, no progress, no guidance.
- Cannot succeed on an empty institution: the structure import references teaching units, study cycles, levels, options, departments, semesters and academic years that no template can create; unresolved rows are silently skipped (only visible in job logs).
- Grades are matched by exam *name* institution-wide (ambiguous across years); no import creates exams or class-course assignments.
- People import also creates enrollments (overlaps the enrollments step); students without a class are skipped.
- Templates are static (hidden "Références" sheet claims to be dynamic, is not); technical headers (`nameFr`, `studyCycleCode`).
- Rollback is a no-op; `/api/import/upload` only checks for a session, not the admin role.

## Target UX
Hub `/import`:
1. **Fondations** (once): Cycles & niveaux → Programmes & options → UE & EC. (Faculties are institutions of type `faculty`, created from the institution hub — not imported.)
2. **Années académiques** (repeatable, oldest first): Année & semestres → Classes → Affectations (cours/enseignants) → Étudiants & inscriptions → Examens → Notes. Decisions/credits of past years are **recalculated** through deliberations (not imported).

Each step = wizard: explanation + automatic prerequisite check → year-specific pre-filled template with Excel dropdowns from the DB (existing rows included so re-import updates) → upload → row-level validation table (row, column, issue, fix) + create/update/unchanged/skipped summary + annotated error file → import with inline progress → result, "annuler cet import", next step. Also "Passer" and "Saisir manuellement" (links to the existing pages). Step status derived from data counts; skips stored per institution.

Grades standard (decided): **grid per EC like a PV** — one workbook per class, one sheet per class course, students as rows (matricule + name prefilled), exams (CC, Examen, Rattrapage) as columns; grades matched by year + class course + exam. Long format (one row per grade) also accepted for exports from other software.

Optional "classeur annuel" (all sheets of a year in one file) validated/imported sheet by sheet.

## Server work
- New import steps: faculties, study cycles & levels, programs & options, teaching units & courses; then academic year & semesters, class courses, exams; year-scoped grades.
- Generic step definition (sheets, FR headers, required/enum/reference columns, DB resolution, plan, execute) on top of batch jobs; tag created rows with the import job id for rollback.
- Admin check on `/api/import/upload`.

Uniqueness to upsert on: study_cycles (institution, code), cycle_levels (cycle, code), programs (institution, code), program_options (program, code), teaching_units (program, code), courses (program, code), semesters (code).

## Phases
1. Hub + complete Fondations + step wizard (validation table, inline progress). **Done** — server: `modules/data-import/steps/*` (generic `ImportStepDef`, `workbook.ts` template/reader), `import.step` batch job, `dataImport.overview|step|template|upload|setStepSkipped`; web: `modules/data-import` (`/import`, `/import/:step`, old importers at `/import/legacy`). UI strings of the new pages are French only (EN translation pending).
2. Per-year steps incl. class courses, exams, PV-grid grades. **Next.** The hub already lists each year with its counts; its chips link to the manual pages until the yearly steps exist.
3. Rollback, annual workbook, fully dynamic templates.
