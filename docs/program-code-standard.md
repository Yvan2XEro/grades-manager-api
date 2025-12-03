# Program & Course Code Standard

This document explains how to introduce consistent codes for faculties, programs, classes, courses, and class-course offerings while aligning with semester information. The goal is to make it easy for future contributors to implement the feature (DB, API, and UI) without guessing the business rules.

---

## 1. Tables that require a `code`

| Entity | Table | Scope of uniqueness | Notes |
| --- | --- | --- | --- |
| Faculty | `faculties` | global | Short identifier (e.g., `FSCI`, `FSEG`) used on exports. |
| Program | `programs` | per faculty | Slug already exists, but we still need a human-friendly code (e.g., `INF-LIC`). |
| Class | `classes` | per academic year | Enables `L1-INF-A`, `M2-MATH-B`, etc. |
| Course (EC) | `courses` | per program | Codes such as `INF111`, `MATH112`. |
| Class Course | `class_courses` | per academic year | Must remain unique even if the same EC is taught to multiple classes. |

Every code column should have a `text` type, a uniqueness constraint within the described scope, and be exposed in Drizzle models and TRPC outputs.

---

## 2. Semesters

To generate meaningful codes (e.g., `INF111` → program INF, level 1, semester 1, course #1), the schema needs explicit semester information.

1. **Semesters table**: either introduce `semesters` or reuse the existing `teaching_units.semester`. Recommended structure:
   ```ts
   export const semesters = pgTable("semesters", {
     id: text("id").primaryKey().default(sql`gen_random_uuid()`),
     code: text("code").notNull(), // e.g., S1, S2
     name: text("name").notNull(),
     orderIndex: integer("order_index").notNull(),
   }, (t) => [unique("uq_semesters_code").on(t.code)]);
   ```
2. **Classes**: add `semesterId` FK so a class is tied to a specific period.
3. **Class courses**: store `semesterId` (defaults to the class semester but allows overrides for split cohorts).
4. **UI**: update class creation forms to pick a semester, and cascade the value when creating class courses/exams.

---

## 3. Code generation rules

Codes can be edited manually, but the UI should prefill them following a deterministic pattern:

1. **Program prefix**: taken from `program.code` (e.g., `INF`).
2. **Level digit**: derived from the selected cycle level (`cycle_level.code` or order index).
3. **Semester digit**: from `semesters.code` (`S1` → `1`, `S2` → `2`).
4. **Remainder/sequence**:
   - For courses: keep a sequence per program + semester (`INF111`, `INF112`).
   - For class courses: append class identifier + academic year, e.g., `INF111-2024A`.

### Frontend generator

Create a helper (e.g., `generateCourseCode({ programCode, level, semester, index })`) that:
- Normalizes the program prefix (upper case, no spaces).
- Pads level/semester digits to one character each.
- Adds the per-semester index (padded to one digit).
- Returns a suggestion that can be overridden by the admin.

The helper should live in a shared location (`apps/web/src/lib/code-generator.ts`) so it can be reused by course/class/classCourse forms.
⚠️ The backend must **never** auto-generate these codes for new records (it should only normalize/validate). The UI prefill is purely a convenience layer so admins can keep editing or overriding the suggestion.

### Backend validation

Even if the frontend suggests a code, the API must:
- Validate uniqueness (throw `BAD_REQUEST`).
- Normalize (trim, uppercase) before inserting.
- Optionally regenerate if code is empty.

---

## 4. Implementation checklist

1. **DB migrations**
   - Add `code` columns + indexes to the tables listed in section 1.
   - Introduce the `semesters` table and add `semester_id` to `classes` and `class_courses`.
   - Backfill existing data with default codes (e.g., slug-derived) and assign semesters (default to S1 if unknown).

2. **Backend**
   - Update Drizzle schemas, type exports, and repos/services.
   - Extend TRPC routers (`classes`, `classCourses`, `courses`, `programs`, `faculties`) to accept the new fields.
   - Expose the `classCourses.roster` endpoint (already implemented) that returns student names/statuses for the selected class course.

3. **Frontend**
   - Update forms to collect/display the code + semester drop-down.
   - Use React Query data and the `generateCourseCode` helper to prefill codes in Course/Class/ClassCourse forms.
   - Provide a reusable “searchable select” component for picking any entity that exposes a `code` (e.g., program, course, classCourse). The component should display both `code` and `name`, allow text filtering (by code or label), and integrate with React Hook Form. Place it under `apps/web/src/components/forms/` so every admin form can use it.
   - Ensure GradeEntry (and other screens) consume the new roster data to show only enrolled students with proper names.

4. **Testing & docs**
   - Add unit tests for the code generator and roster filtering.
   - Update TODO.md (see below) and add screenshots/notes once UI changes are in place.
- **TRPC lookups by code**: every module that gains a code (`faculties`, `programs`, `classes`, `courses`, `classCourses`) must expose a `getByCode` or `findByCode` procedure so other services and the UI can resolve entities without an ID. Implement the Drizzle repo helper plus a TRPC endpoint returning a single record (404 if not found).

---

## 5. References

- `apps/server/src/db/schema/app-schema.ts`
- `apps/web/src/pages/admin/CourseManagement.tsx`
- `apps/web/src/pages/teacher/GradeEntry.tsx`
- `docs/atomic-enrollment-and-cycles.md`

Use this guide to align future contributions with the required data model and UX behavior.
