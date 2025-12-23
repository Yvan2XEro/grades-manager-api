# Admin Exam Management Enhancements

## Context
Administrators currently create/update exams from `/admin/exams`, but they cannot jump straight into the grade-entry workflow or refine the exam list when dozens of sessions exist. Everything is fetched client-side without pagination or filtering, which breaks down in real deployments. To close the loop with exam grade delegation, the admin-facing list needs richer navigation plus reusable UI primitives we can reuse in other back-office views.

This document captures the requirements for:

1. Linking each scheduled exam to the grade-entry surface so admins can review/override scores.
2. Server-backed filtering (search + academic year) with cursor pagination.
3. Shared UI components (`DebouncedSearchField`, `AcademicYearSelect`) that other screens can adopt.

## Goals

1. **Grade entry navigation** — From `/admin/exams`, every exam row exposes an action (“Review grades”) that opens the teacher grade entry screen (`/teacher/grades/:classCourseId`) preselecting the matching exam.
2. **Search + pagination** — The admin exam list calls a paginated TRPC endpoint (`exams.list`) accepting `query`, `academicYearId`, `cursor`, `limit` and returning `{ items, nextCursor, total }`.
3. **Reusable inputs** — Introduce two shared components:
   - `DebouncedSearchField`: wraps an `<Input>` but exposes `value`, `onChange`, optional `delay` (default 300 ms) and a clear button. Emits changes only after the debounce interval.
   - `AcademicYearSelect`: fetches academic years via TRPC, auto-selects the active year, and exposes `value`, `onChange`, `disabled`, and optional `placeholder`. Reuse in dashboard filters later.

## UX Flow

1. Admin opens `/admin/exams`.
2. Above the table we render `AcademicYearSelect` (default active year) + `DebouncedSearchField`.
3. Changing either control resets the table, fetches page 1 with the new filters, and resets the cursor.
4. Table footer shows “Load more” or pagination controls, wired to `nextCursor`.
5. Each exam row includes actions:
   - “Edit” / “Delete” (existing).
   - “Review grades” → navigates to `/teacher/grades/:classCourseId?examId=<exam>`.

## Backend Requirements

1. **tRPC**: extend `exams.list` schema to accept `query`, `academicYearId`, `cursor`, `limit`. The server filters by:
   - `academicYearId` (default: active academic year for the institution).
   - `query`: partial match on exam name, class name, course name, or codes (ILIKE).
2. Return `items` enriched with `classCourse` data (`classCourseId`, `className`, `courseName`) needed for the admin table + grade-entry links.
3. Provide `nextCursor` for pagination (string ID).

## Frontend Components

### DebouncedSearchField (`apps/web/src/components/inputs/DebouncedSearchField.tsx`)

- Props:
  ```ts
  type DebouncedSearchFieldProps = {
    value: string;
    onChange: (value: string) => void;
    delay?: number; // default 300
    placeholder?: string;
    className?: string;
  };
  ```
- Uses `useEffect` + `setTimeout` or `useDebounce` hook.
- Renders `<Input type="search">` with an optional clear button.

### AcademicYearSelect (`apps/web/src/components/inputs/AcademicYearSelect.tsx`)

- Loads academic years via `trpc.academicYears.list`.
- Automatically selects the active year (one with `isActive === true`). Exposes `value`, `onChange`.
- Displays label + helper text when no active year exists.
- Accepts props: `value`, `onChange`, `disabled`, `placeholder`.

## `/admin/exams` Wiring

1. Replace the static exam query with `useInfiniteQuery` (React Query) or manual cursor fetching.
2. Bind filters to local state:
   ```ts
   const [search, setSearch] = useState("");
   const [academicYearId, setAcademicYearId] = useState<string | null>(null);
   ```
3. Pass these filters to `trpc.exams.list` query.
4. Render grade-review button:
   ```tsx
   <Button variant="ghost" onClick={() => navigate(`/teacher/grades/${exam.classCourseId}?examId=${exam.id}`)}>
     {t("admin.exams.actions.reviewGrades")}
   </Button>
   ```

## Implementation Notes

- Keep both new components under `apps/web/src/components/inputs/` and export them from an `index.ts`.
- After adding new i18n strings (search placeholder, “Review grades”, etc.), run `bun run --filter web i18n:gen`.
- Ensure server tests cover the new `exams.list` filters (search & year).
- When linking admins to `/teacher/grades/...`, verify permissions (admins already have rights).

With this foundation documented, we can split the work into backend schema changes, reusable inputs, and the admin-exam page refactor tracked in `TODO.md`.
