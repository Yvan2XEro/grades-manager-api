# Seed Setup & Reference Playbook

This document explains how to stand up a reproducible dataset for the platform. The goal is to allow any developer to bootstrap the application with realistic codes/relationships (faculties → programs → options → classes → courses → classCourses) plus the baseline catalog (exam types, study cycles, semesters, etc.) and jump straight into feature work.

The approach relies on a small set of structured files (JSON/YAML) that reference each other via `code` fields so the seeds remain readable while staying deterministic.

---

## 1. Objectives

1. **One-command bootstrap** – After cloning the repo and running `bun install`, a developer can run `bun run --filter server seed` (with optional file overrides) to populate the database.
2. **Code-centric references** – Every relation (faculty ↔ programs, program ↔ options/classes/UEs, classes ↔ courses/classCourses) must resolve via the `code` column that already exists at the database level.
3. **Composable layers** – Seeds are split into layers (foundation, academics, users) so teams can swap data sets (demo vs. tests) without rewriting everything.
4. **Traceable inputs** – Each file includes metadata (version/date) so we know which edition was used when debugging downstream data.

---

## 2. File layout

```
seed/local/                # gitignored workspace folder (override with $SEED_DIR)
├─ 00-foundation.yaml      # exam types, faculties, study cycles, semesters
├─ 10-academics.yaml       # programs, options, classes, courses, classCourses, teaching units
└─ 20-users.yaml           # Better Auth accounts, domain users (admins, teachers, students), enrollments
```

Each `.yaml` (or `.json`) file exports an array of entities grouped by table. Example snippet for `10-academics.yaml`:

```yaml
programs:
  - code: INF-LIC
    name: Informatique Licence
    facultyCode: SCI
    description: Licence Informatique générale
programOptions:
  - programCode: INF-LIC
    code: INF-GEN
    name: Tronc commun
    description: Option par défaut
classes:
  - code: INF11-A
    name: L1 Informatique A
    programCode: INF-LIC
    programOptionCode: INF-GEN
    cycleLevelCode: L1
    academicYearCode: AY-2024
    semesterCode: S1
courses:
  - code: INF111
    name: Algèbre 1
    programCode: INF-LIC
    teachingUnitCode: INF-FOND
    defaultTeacherCode: TCH-ALEX
classCourses:
  - code: INF121
    classCode: INF11-A
    classAcademicYearCode: AY-2024
    courseCode: INF111
    teacherCode: TCH-ALEX
```

**Key rules**

- Every foreign key column maps to a `*Code` field in the seed file (e.g., `facultyCode`, `programOptionCode`).
- Codes must be unique within their table’s scope to match the DB constraints (`faculties.code`, `programs.code`, `classes.code`, etc.).
- When a reference is missing (e.g., `cycleLevelCode`), the seed script stops with an error to avoid partial datasets.
- When referencing a class from other files, include `classAcademicYearCode` whenever the same code can exist across multiple academic years.

---

## 3. Generating sample files

To help new contributors, the repo ships with a scaffolding command that writes sample templates into the gitignored directory (defaults to `seed/local`, override with `$SEED_DIR` or `--dir`):

```bash
bun run --filter server seed:scaffold

# overwrite existing files or change the destination
bun run --filter server seed:scaffold -- --dir tmp/seeds --force
```

You can edit those YAML files freely without affecting Git history.

---

## 4. Seeder workflow

1. **Database readiness**
   ```bash
   bun run db:push          # ensures the DB schema + enums/tables exist
   ```
2. **Generate templates (optional if you already curated files)**
   ```bash
   bun run --filter server seed:scaffold
   ```
3. **Seed command** (default stack)
   ```bash
   bun run --filter server seed \
     --foundation seed/local/00-foundation.yaml \
     --academics seed/local/10-academics.yaml \
     --users seed/local/20-users.yaml
   ```
4. **Partial overrides**
   ```bash
   bun run --filter server seed --academics seed/custom/academics-demo.yaml
   ```

The CLI (`apps/server/src/scripts/seed.ts`) parses each layer sequentially, resolving codes to IDs before insertion. For example, to insert a class we lookup:

- `programId = lookup.programByCode(programCode)`
- `optionId = lookup.optionByCode(programId, programOptionCode)`
- `cycleLevelId = lookup.cycleLevelByCode(cycleLevelCode)`
- `academicYearId = lookup.academicYearByCode(academicYearCode)`
- `semesterId = lookup.semesterByCode(semesterCode)`

This mirrors the server-side validation already present in `classes.service.ts`.

---

## 5. Tables to cover

| Layer          | Tables                                                                                 | Notes                                                                                          |
| -------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Foundation     | `exam_types`, `faculties`, `study_cycles`, `cycle_levels`, `semesters`, `academic_years` | Minimal set needed by downstream modules (codes must be unique + descriptive)                 |
| Academics      | `programs`, `program_options`, `teaching_units`, `courses`, `classes`, `class_courses`, `exam_schedule_runs` (optional) | Anything referencing `program_code` or `class_code` lives here                                 |
| Users & domain | `domain_users`, `teachers`, `students`, `enrollments`, `student_course_enrollments`, `users` (auth) | Teachers/students are connected back to classes via `classCode` and `domainUserCode`          |
| Catalog extras | `exam_types`, `notifications`, `rules-engine` defaults                                  | Extend as needed per project                                                                     |

All of these tables expose a `code` attribute (or can derive one), which keeps seed references readable.

---

## 6. Developer checklist

1. Confirm Postgres is accessible via `DATABASE_URL`.
2. Run schema migrations (`bun run db:push`).
3. Run the scaffolding command (if you need starter files) and tweak the YAMLs locally.
4. Execute the seed command with the desired layers (foundation/academics/users).
4. Log in using the seeded administrator (from `20-users.yaml`) to start interacting with the UI.
5. When adding new modules, extend this playbook to describe the ordering + new entities.

---

## 7. Implementation notes

- **Idempotency**: The seed script should upsert by `code` (e.g., `insert ... on conflict (code) do update`) so re-running the command refreshes data.
- **Dependencies**: Always seed parent entities first (`faculties` → `study_cycles` → `programs` → `classes`), otherwise FK checks will fail.
- **Testing**: The Bun/PGlite suite (`apps/server/src/seed/__tests__/seed-runner.test.ts`) loads these YAML files end-to-end to guard against regressions.
- **Extensibility**: Additional YAML files can be passed via CLI flags (e.g., `--examTypes seed/custom/exam-types.yaml`) without touching the default files.

---

With this structure in place, onboarding a new developer becomes a matter of cloning the repository, running `bun install`, executing the seed command(s), and logging in with the pre-created admin account. All business tables retain their codes, so referencing entities across files stays straightforward and human-readable.
