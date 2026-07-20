# Catalog Entity Hubs — Design Spec

**Date:** 2026-07-13

## Goal

Replace dialog-heavy detail flows for Programs and Classes with proper hub-and-tabs pages, following the established `TeachingUnitDetail` / `ProfileHub` pattern. Programs gain a dedicated Options tab and an Export Templates tab. Classes gain a Students tab and a Courses tab scoped to that class.

## Background

The codebase already uses a consistent hub/tabs pattern: a layout component fetches the entity, provides context, renders a `HubNav`, and each tab is a focused sub-page (see `ProfileHub`, `TeachingUnitDetail`, `CenterDetail`). Several entities still use the older dialog-on-list pattern; Programs and Classes have the most to gain.

**Current state:**
- Programs: list + `FormModal` for edit + context-menu dialog for Options + Options embedded in program form for Export Templates
- Classes: list + `FormModal` for edit + separate `Dialog` for student roster + separate page (`ClassCourseManagement`) for course assignments

**Target state:**
- Clicking a program row → navigates to `/admin/programs/:programId/details`
- Clicking a class row → navigates to `/admin/classes/:classId/details`
- All sub-operations available as tabs within the hub page

---

## Architecture

### New file structure

```
apps/web/src/pages/admin/programs/
  ProgramDetail.tsx          # hub layout + ProgramContext
  ProgramDetailsTab.tsx      # program meta form
  ProgramOptionsTab.tsx      # options CRUD table
  ProgramExportTemplatesTab.tsx  # export template assignments

apps/web/src/pages/admin/classes/
  ClassDetail.tsx            # hub layout + ClassContext
  ClassDetailsTab.tsx        # class meta form
  ClassStudentsTab.tsx       # enrolled students list
  ClassCoursesTab.tsx        # course assignments scoped to this class
```

### New routes (App.tsx additions)

Both hubs are registered **outside** their parent hub layouts (same as `TeachingUnitDetail`), so they get the full viewport without the parent's tab bar.

```
/admin/programs/:programId                      → ProgramDetail
/admin/programs/:programId/details              → ProgramDetailsTab
/admin/programs/:programId/options              → ProgramOptionsTab
/admin/programs/:programId/templates            → ProgramExportTemplatesTab

/admin/classes/:classId                         → ClassDetail
/admin/classes/:classId/details                 → ClassDetailsTab
/admin/classes/:classId/students                → ClassStudentsTab
/admin/classes/:classId/courses                 → ClassCoursesTab
```

Index redirect: `/admin/programs/:programId` → `details`; `/admin/classes/:classId` → `details`.

### HubNav tabs config

```ts
// ProgramDetail
const PROGRAM_TABS = [
  { path: "details",   labelKey: "programs.hub.tabs.details" },
  { path: "options",   labelKey: "programs.hub.tabs.options" },
  { path: "templates", labelKey: "programs.hub.tabs.templates" },
] as const;

// ClassDetail
const CLASS_TABS = [
  { path: "details",  labelKey: "classes.hub.tabs.details" },
  { path: "students", labelKey: "classes.hub.tabs.students" },
  { path: "courses",  labelKey: "classes.hub.tabs.courses" },
] as const;
```

---

## ProgramDetail Hub

### ProgramDetail.tsx

- Fetches program via `trpc.programs.getById.useQuery({ id: programId })` (endpoint must exist or be added — see Backend section)
- Renders back-link `← Programs` → navigates to `/admin/programs/programs`
- Header: program `name` as title, `code` as subtitle badge
- Provides `ProgramContext` (value: `{ program, refetch }`) to all tab children
- Renders `<HubNav tabs={PROGRAM_TABS} basePath={…} />`
- Loading: skeleton header + skeleton tabs
- Not-found: redirect to `/admin/programs/programs`

### ProgramDetailsTab.tsx

Fields (same as current `FormModal`, minus Options and Export Templates):

**Identity section**
- `name` (required, FR) + `nameEn` (optional, EN)
- `code` (required) + `abbreviation` (optional)
- `description` (optional, textarea)

**Academic section**
- `domainFr` + `domainEn`
- `specialiteFr` + `specialiteEn`
- `cycleId` — select from `studyCycles.list`
- `centerId` — select from `centers.list`; shows `isCenterProgram` toggle when center is selected

**Document titles section**
- `diplomaTitleFr` + `diplomaTitleEn`
- `attestationValidityFr` + `attestationValidityEn`

Save: calls `trpc.programs.update` with the form payload. Shows toast on success. Invalidates `programs.getById` query.

### ProgramOptionsTab.tsx

Replaces the per-row context-menu Options dialog from `ProgramManagement`.

- Lists options via `trpc.programOptions.list({ programId })`
- Table columns: Name, Code, Description, Actions
- "Add Option" button → `Dialog` with form: name (required), code (required), description (optional)
- Edit (pencil icon or context menu) → same dialog pre-filled
- Delete (trash icon) → `AlertDialog` confirm → `trpc.programOptions.delete`
- Empty state: "No options yet" with Add Option CTA
- All mutations invalidate `programOptions.list`

### ProgramExportTemplatesTab.tsx

Extracts the `exportTemplates` array from the program form into a dedicated tab.

- Loads available templates via `trpc.exportTemplates.list`
- Renders one row per document type (9 types):
  `diploma`, `transcript`, `attestation`, `student_list`, `pv`, `evaluation`, `ec`, `ue`, `deliberation`
- Each row: document type label + `Select` (options: "None" + each matching template name)
- Single "Save" button → calls `trpc.programs.update({ id, exportTemplates: [...] })`
- Initialises selections from `program.exportTemplates` (from `ProgramContext`)

---

## ClassDetail Hub

### ClassDetail.tsx

- Fetches class via `trpc.classes.getById.useQuery({ id: classId })` (endpoint must exist or be added — see Backend section)
- Renders back-link `← Classes` → navigates to `/admin/classes/classes`
- Header: class `code` as title, `label` as subtitle, academic year badge
- Provides `ClassContext` (value: `{ class: cls, refetch }`) to all tab children
- Renders `<HubNav tabs={CLASS_TABS} basePath={…} />`
- Loading: skeleton; Not-found: redirect to `/admin/classes/classes`

### ClassDetailsTab.tsx

Fields (same as current `FormModal`):
- `code` (required), `label` (optional)
- `programId` → `cycleLevel` → `optionId` → `semesterId` cascading selects (same logic as current form)
- `academicYearId` select

Save: calls `trpc.classes.update`. Invalidates `classes.getById`.

### ClassStudentsTab.tsx

Promotes the student roster dialog.

- Fetches via `trpc.enrollments.listEnrollments({ classId })` (the existing list procedure already accepts `classId` as an optional filter)
- Table columns: Name, Registration #, Status badge, Enrollment date, Link (→ `ProfileHub`)
- Clicking a student row (or a "View Profile" action) navigates to `/admin/profiles/:profileId`
- Empty state: "No students enrolled" with a link to the Enrollments tab of ClassesHub
- Read-only — enrollment creation stays in ClassesHub → Enrollments

### ClassCoursesTab.tsx

Scoped view of course assignments for this class.

- Fetches via `trpc.classCourses.list({ classId })` (`classId` is already an optional filter on the existing list procedure)
- Table columns: Course (code + name), Teacher, Hours, Actions
- "Assign Course" button → small dialog: course select + teacher select + hours — calls `trpc.classCourses.create`
- Edit → same dialog pre-filled → `trpc.classCourses.update`
- Remove → `AlertDialog` confirm → `trpc.classCourses.delete`
- All mutations invalidate `classCourses.listByClass`

---

## List Page Changes

### ProgramManagement.tsx (teacher/ProgramManagement.tsx)

- Row click → `navigate(\`/admin/programs/${program.id}/details\`)` instead of opening `FormModal`
- Context-menu "Edit" → same navigation
- Context-menu "Manage Options" → removed (Options now live on the hub)
- "Create" button → keeps its current `FormModal` but slimmed down: only `name`, `code`, `cycleId`. After successful create → navigate to the new program's hub
- Remove `editingProgram`, `optionProgram`, `editingOption` state and all associated dialog logic

### ClassManagement.tsx

- Row click → `navigate(\`/admin/classes/${cls.id}/details\`)` instead of opening edit dialog
- Context-menu "Edit" → same navigation
- Context-menu "View Roster" → removed (Students now live on the hub)
- "Create" button → keeps its `FormModal` (cascading selects work best in a dialog). After successful create → navigate to the new class's hub
- Remove student-roster `Dialog` and associated state

---

## Backend Considerations

All required endpoints already exist — this is a frontend-only change.

| Endpoint | Status | Used by |
|---|---|---|
| `trpc.programs.getById` | ✅ exists (`programs.router.ts:39`) | `ProgramDetail` hub |
| `trpc.classes.getById` | ✅ exists (`classes.router.ts:41`) | `ClassDetail` hub |
| `trpc.classCourses.list({ classId })` | ✅ `classId` is an optional filter on the existing list procedure | `ClassCoursesTab` |
| `trpc.enrollments.listEnrollments({ classId })` | ✅ `classId` is an optional filter on the existing list procedure | `ClassStudentsTab` |
| `trpc.programOptions.list/create/update/delete` | ✅ all exist | `ProgramOptionsTab` |
| `trpc.programs.update` | ✅ exists | `ProgramDetailsTab`, `ProgramExportTemplatesTab` |
| `trpc.classes.update` | ✅ exists | `ClassDetailsTab` |

No backend migrations, no new procedures, no schema changes required.

---

## i18n

New keys needed in both `en/translation.json` and `fr/translation.json`:

```jsonc
// English
"programs": {
  "hub": {
    "tabs": {
      "details": "Details",
      "options": "Options",
      "templates": "Export Templates"
    },
    "backLink": "Programs"
  }
},
"classes": {
  "hub": {
    "tabs": {
      "details": "Details",
      "students": "Students",
      "courses": "Courses"
    },
    "backLink": "Classes"
  }
}

// French
"programs": {
  "hub": {
    "tabs": {
      "details": "Détails",
      "options": "Options",
      "templates": "Modèles d'export"
    },
    "backLink": "Programmes"
  }
},
"classes": {
  "hub": {
    "tabs": {
      "details": "Détails",
      "students": "Étudiants",
      "courses": "Cours"
    },
    "backLink": "Classes"
  }
}
```

---

## Testing

No new backend logic is introduced — only new/adjusted queries and routing. Tests:

- Type-check (`bun check-types`) must pass after all changes
- Verify `programs.getById` and `classes.getById` endpoints exist and return correct shape; if added, cover with a caller test in `__tests__/`
- Manual smoke: navigate list → click row → hub loads on correct tab → each tab renders data → save works

---

## Out of Scope

- Faculties detail hub (deferred — lower priority, tolerable current UX)
- Study Cycles detail hub (deferred — inline card pattern is acceptable)
- Creating a program/class from within the hub (create stays as a list-page dialog)
- Bulk operations (stay on the list pages)
