# Data import — year import wizard (spec)

> Replaces the "years" part of `data-import-redesign.md`. Status: **implemented** (all five deliveries). See "11. As built" for the decisions taken while building it.

## 1. Who and why

The typical client arrives with **all its data in files** (Excel exports from another software, deliberation reports, class lists) and several years of history. They want to:

- import **in bulk**, year by year, without retyping anything;
- **never get lost**: know at any time what is done, what is left, what is blocking and why;
- **see before saving** what will be created, updated or rejected, row by row;
- **fix and reimport** without creating duplicates, and **undo** a failed import.

Manual entry has no place in this flow: it already exists elsewhere in the application.

## 2. Flow

```
Getting started
├── 1. Institution profile                 (form, once)
├── 2. Foundations                         (once, 3-step wizard — shipped)
│      Cycles & levels → Programs & options → Teaching units & courses
└── 3. Academic years
       [ + Import a year ]  → year import wizard
       2023-2024  ██████████ done          [Resume] [Report]
       2024-2025  ██████░░░░ 6/9 steps     [Resume]
       2025-2026  ░░░░░░░░░░ to do         [Import]
```

### 2.1 "Import a year" — the wizard

One full-screen wizard per year that **lays out everything importable as steps**, in dependency order. Left: the list of steps with their status; right: the current step.

**Step 0 — Year framing**

- Pick an existing year or create it: name (2024-2025), dates, semesters.
- The year kind is **derived, not asked**: a year whose end date is in the past is historical (exams closed and locked after import, no notifications, students' current class untouched unless it is their latest year); otherwise it is a current year (exams open, normal workflow).
- Files can be brought either as **one workbook per step** (pre-filled templates to download) or as **a single workbook for the year**: the wizard recognises each sheet by its headers and routes it to the right step. Steps already covered go straight to "to review". Both work at any time; there is no mode to choose.

**Steps 1 to 8 — same mechanics for each**

1. **What the step does**: two lines of explanation, plus what already exists for this year (e.g. "12 classes already present").
2. **Template** to download, **pre-filled** with:
   - the year's existing data;
   - dropdown lists fed by previous steps (class codes, registration numbers, courses);
   - required columns marked.
3. **File upload**, then a **preview in a large dialog**:
   - every row with a status: *create*, *update*, *unchanged*, *error*, *warning*;
   - filters by status and search;
   - errors shown on the faulty cell, with the expected fix;
   - for an update, the values before and after;
   - "Download annotated file": the client's file with errors as cell comments.
4. **Validate the step**. Only valid rows are saved, and the next step becomes available.

An optional step can be marked "not applicable". The wizard **resumes where it was left**: its state is stored server-side.

**Final step — Closing the year**

- Summary: number of records created and updated per step, rejected rows, with a link to each report.
- End-of-year processing, offered and started in one click:
  - credit computation;
  - student summaries;
  - for a historical year: one deliberation per class, computed from the imported grades and left as draft for review.
- **Comparison with official decisions**: when the file carries jury decisions (passed, failed, repeat…), the wizard lists the students whose computed decision differs. Gaps reveal a missing grade or a misconfigured rule. Nothing is overwritten silently.

### 2.2 The steps of a year

| # | Step | Required | Client provides | What the wizard generates on its own |
|---|------|----------|-----------------|---------------------------------------|
| 1 | Classes | yes | code, name, program, option, level | proposal: one class per program × level (like "Bulk generation"); the client completes or fixes it |
| 2 | Teachers | no | name, email, phone | — |
| 3 | Students & enrollments | yes | registration number, identity, class of the year, status | — |
| 4 | Parents / guardians | no | student (registration number), parent, relationship | — |
| 5 | Class courses (assignments) | yes | exceptions only | **every course of the curriculum** for each class (program, level, teaching-unit semester), default coefficient; the file only gives teachers and coefficient fixes |
| 6 | Course enrollments | no | exceptions only (exemptions, retakes of a course from another year) | **every enrolled student × every course of their class** |
| 7 | Exams | yes | exceptions only | from an **evaluation model** chosen once (e.g. CA 40 % + Exam 60 % + Retake that replaces), applied to every course; dates optional |
| 8 | Grades | yes | the grades | **report-style grid** template (see 2.3), pre-filled with the students and exams of steps 3 and 7 |

For a standard year **the client provides 3 files** (classes, students, grades) **and makes 2 choices** (evaluation model, applied curriculum). Everything else is derived and stays editable by file.

### 2.3 Grades: the report grid

- **One workbook per class**, or a single workbook with one sheet per class/course pair — both are accepted.
- Sheet "Course — Algorithms (INF111)":
  - rows: the enrolled students, pre-filled (registration number, name);
  - columns: the exams (CA, Exam, Retake), with their weight in the header.
- Accepted values:
  - a grade from 0 to the scale maximum (comma or dot);
  - `ABS` for an absent student;
  - empty = no grade.
- **Long format** also accepted, for exports from other software: `registration number | class | course code | exam | grade`.
- A grade is attached by year + class + course + exam type, never by exam name alone.

## 3. Links between data

### 3.1 Natural keys (what identifies a row in a file)

| Data | Natural key | References | Uniqueness in DB |
|------|-------------|------------|------------------|
| Cycle | code | — | (institution, code) |
| Level | cycle code + level code | cycle | (cycle, code) |
| Program | code | cycle | (institution, code) |
| Option | program code + option code | program | (program, code) |
| Teaching unit | program code + unit code | program | (program, code) |
| Course | program code + course code | program, teaching unit | (program, code) |
| Year | name (2024-2025) | — | (institution, name) |
| Class | code + year | program, option, level, year | (code, year) |
| Teacher | email | — | **none** (guaranteed by the import) |
| Student | **registration number** | person | registration number (global) |
| Enrollment | registration number + year | student, class, year | (student, year) — added |
| Class course | class code + course code (+ year) | class, course, teacher | (class, course) |
| Course enrollment | registration number + course + year + attempt | student, class course | (student, course, year, attempt) |
| Exam | class + course + type (+ year) | class course, parent exam for a retake | **none** (guaranteed by the import: one exam per type per course) |
| Grade | registration number + exam | student, exam | (student, exam) |

### 3.2 Resolution rules

- **Codes are normalised** (upper case, no spaces, no accents) before comparison. Column headers are matched ignoring case and accents.
- **A reference is resolved first in the file**, among the valid rows of an earlier step of the same wizard, **then in the database**. Everything can therefore be dropped at once in the single workbook: a class created in the "Classes" sheet is known to the "Students" sheet before it is even saved.
- **Unknown reference**: error on the cell, with the expected fix ("Class IGL-BTS1 unknown for 2024-2025: add it to the Classes sheet"). The row is rejected; the others go on.
- **Ambiguous reference** (e.g. two people with the same name and no registration number): error, never an arbitrary pick.
- **Cascading rejection, but visible**: if a class is rejected, its students are rejected with "class rejected at row 12 of the Classes sheet". The client reaches the cause in one click.
- **Reimport = update, never a duplicate**: the natural key finds the existing row. A row missing from the file is **never deleted**.

### 3.3 Principle: adapt to the file, row by row

The wizard never asks for a global mode. **Each row is handled according to what it contains**, and one file may mix situations.

- **Registration number**:
  - provided: kept and used as key;
  - missing: generated with the institution's registration number format;
  - to find an already known person, the wizard tries, in order, registration number, email, then last name + first name + date of birth;
  - when in doubt (two possible people), the row is an error listing the candidates.
- **Headers**: synonyms recognised ("Matricule", "N° matricule", "Registration number", "Mat."…), ignoring case and accents. Unknown columns are ignored and reported.
- **Values**:
  - dates as `dd/mm/yyyy`, `yyyy-mm-dd` or Excel dates;
  - grades with comma or dot, out of 20 or the institution's scale (detected);
  - codes tolerant to spaces and case.
- **Absences**: `ABS`, `Abs`, `absent` and `AJ` are recognised. They are stored as an absence (participation), not as a grade, and computed with the absence rule already configured for the institution.
- **Jury decisions of past years**:
  - when the file has them (a "Decision" column or report sheet), they are compared with the recomputed decisions; each gap can be kept as the official decision, which creates a traced override;
  - otherwise decisions are simply computed.
- **Teachers**:
  - a profile is created, or found by email, or by name when the email is missing;
  - creating an account stays a separate action ("Invite imported teachers"), never forced.
- **Student present over several years**: one person and one student record, with one enrollment per year. The current class is only updated when the imported year is the most recent one.
- **Repeaters and transfers**: simply two enrollments over two years. The origin of a transfer (institution, credits) goes in optional columns.
- **Retake**: attached to the main exam of the same course. The scoring policy (replace, best, average) comes from the evaluation model and can be set per course.
- **Exam weights of a course not summing to 100 %**: warning, not an error.
- **Grade on a locked exam** (reimport of a closed year): refused, unless an administrator explicitly reopens the year for correction.

## 4. What the import does around it (and what it does not)

- **It writes directly**, without the grade-entry workflow (submission then approval by the dean). The validation rules stay the same:
  - grade within the scale;
  - student enrolled in the course;
  - no locked exam.
- **Historical year**: on closing, exams become *approved + locked* and no notification is sent.
- **Does not compute** jury decisions at import time. They are computed by the deliberations at the end of the wizard.
- **Does not run** the year transition (promotion to the next year): when importing history, next year's enrollments come from the file, not from a computed promotion.
- **Fees** (fee structures, payments): an optional step delivered after grades (delivery 5).

## 5. Undoing an import

Each validated step creates an **import batch** that records every created row and every changed value (with its previous value). "Undo this batch":

- deletes what it created;
- restores what it changed;
- refuses when data created later depends on it (e.g. undoing classes that already have grades), listing those dependencies.

## 6. Gaps in the current code

| Finding | Consequence | Fix |
|---------|-------------|-----|
| `autoEnrollClass` selects students by `students.class` (current class) | wrong course enrollments for a past year | **done**: selects by the year's `enrollments` |
| `enrollments` has no (student, year) uniqueness | duplicates possible on import | **done**: partial unique index on open enrollments (mid-year transfers keep a closed one) + cleanup migration |
| `grades.upsertNote` requires exam-workflow rights | unusable in bulk | bulk grade-writing service (same checks, no workflow) |
| exams have no (course, type) uniqueness | ambiguous grade attachment | the import guarantees one exam per type per course |
| teachers: no email uniqueness | duplicate people | match by normalised email in the import |
| `semesters` are global (S1/S2 for every institution) | — | use existing semesters, never create any on import |
| legacy importers (`import.people`, `import.gradesBulk`…) | match by exam name, rows silently skipped | replaced by the wizard, then removed |

## 7. Volumes and performance

For an average institution over one year: about 2,000 students, 60 classes, 1,500 class courses, 4,500 exams and 150,000 grades.

- **Preview**: computed server-side, shown as a paginated, filtered table. 150,000 rows are never sent to the browser.
- **Validation**: background batch processing in chunks of 500 rows, with progress shown in the wizard.
- **Grades**: bulk write, then a single credit recompute per student at closing, not one per grade.

## 8. Delivery plan

1. **Year wizard** (framing, step list, resume) + **Classes** + **Students & enrollments**, with preview dialog and annotated file.
2. **Class courses generated from the curriculum** + **evaluation model** (generated exams) + **generated course enrollments**.
3. **Grades** as report grid and long format, then **closing**: credits, locking, draft deliberations.
4. **Single workbook for the year** (automatic sheet recognition), **comparison with official decisions**, **batch undo**.
5. Teachers, parents, then fees.

Each delivery is tested end to end with a realistic file set: 3 years, 2,000 students, with repeaters, transfers and retakes.

## 11. As built

Steps of the year wizard (`/import/years/:yearId`), in order: Classes, Teachers (optional), Students & enrollments, Parents (optional), Class courses, Exams, Grades, Closing (action), Official decisions (optional), Fees (optional). Server: `apps/server/src/modules/data-import/steps/year-*.ts`; web: `apps/web/src/modules/data-import`.

Decisions taken while building:

- **Year kind** is derived from its end date (past = history), never asked.
- **Teaching units have a level** (`teaching_units.cycle_level_id`, settable in the Foundations file and in the unit form): class courses are proposed from the units at the class level. Units without level are reported, not guessed.
- **Teachers without account** are plain profiles; a class course needs a teacher, so a single "unassigned teacher" placeholder profile per institution stands in until one is given.
- **Course enrollments** are generated (all students of a class × its courses) by the Class courses and Students steps; exemptions are made afterwards by withdrawing a course enrollment, not in a file.
- **Absences** (`ABS`, `absent`, `AJ`) count as 0: the credit computation has no absence concept. The review reports how many.
- **Exam weights**: the pre-filled model uses the exam types' default weights; types without one share what is left of 100 %. A retake takes the weight of the exam it replaces. Locked exams are never changed.
- **Closing** locks the exams of a past year, recomputes credits and computes one annual deliberation per class, left open for review; it can be re-run.
- **Official decisions** gaps are warnings; importing keeps the official decision as a traced override.
- **Review**: shown in the wizard (full width) rather than in a dialog: totals per sheet, errors, warnings, and a "Changes" tab with before → after values (capped at 5,000 rows). "Download the annotated file" returns the client's file with each problem as a note on its cell, in the user's language.
- **Single workbook**: dropped once per year; each step checks its own sheets from it, in dependency order, so references between sheets resolve against what the previous steps saved.
- **Undo**: every year step journals what it creates and changes (`import_journal_entries`); undoing is refused while later data depends on it.
- **Templates** (sheet names, headers, notes) are in French, the language of the files clients hold; English and common alternative headers are accepted on import. Issue messages and the UI are translated (FR/EN).
- The former single-file importers and `/import/legacy` are removed (the URL redirects to `/import`).

