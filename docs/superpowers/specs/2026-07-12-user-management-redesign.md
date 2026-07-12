# User Management Redesign

**Date:** 2026-07-12
**Status:** Approved

## Problem

The current `/admin/users` section has three structural issues:

1. **Role duplication.** `UserManagement` (accounts tab) and `StudentManagement` (students tab) both list `domainUsers` from the same table. Adding a "dean management" or "teacher management" view would require a third page duplicating the same list/filter/table/CRUD pattern.
2. **Broken guardian UX.** `GuardiansManagement` forces an admin to pick a student first, then see that student's guardians. There is no way to search for a guardian by name or see all guardians at once.
3. **Mismatched pagination.** Both pages use infinite scroll, which is appropriate for content feeds but not for an admin people directory where users need total counts and the ability to jump to a specific page.

## Solution: Option A — Unified People list + Guardian directory

### Architecture

| Tab | Path | Replaces |
|-----|------|----------|
| People | `/admin/users/people` | `accounts` + `students` tabs |
| Guardians | `/admin/users/guardians` | `GuardiansManagement` |
| API Keys | `/admin/users/api-keys` | unchanged |

**Files deleted:**
- `pages/admin/UserManagement.tsx` (1023 lines)
- `pages/admin/StudentManagement.tsx` (2344 lines)
- `pages/admin/GuardiansManagement.tsx` (390 lines)

**Files created:**
- `pages/admin/users/PeopleManagement.tsx`
- `pages/admin/users/GuardianDirectory.tsx`

**Redirects added in App.tsx:**
- `/admin/users/accounts` → `/admin/users/people`
- `/admin/users/students` → `/admin/users/people`

---

## PeopleManagement tab (`/admin/users/people`)

### Filters

- **Search:** name or email, ILIKE, debounced
- **Role chips:** All | Admin | Dean | Teacher | Student | Staff | Grade Editor
- **Status dropdown:** All | Active | Inactive | Suspended
- **When role = Student only:** Class dropdown + Academic Year dropdown appear

### Table columns (base)

| Name | Role (badge) | Email | Status (badge) | Actions (···) |

### Table columns when role chip = Student

| Name | Role (badge) | Class | Reg. Number | Enrollment Status (badge) | Actions (···) |

Email column is hidden when Student is selected (columns are contextual, not additive).

### Interactions

- **Row click** → `/admin/profiles/:domainUserId` (ProfileHub)
- **`···` menu** → Edit profile / Deactivate / Delete
- **`+ Add person`** → existing create dialog from UserManagement (no UX change)
- **Bulk select** → bulk delete (same pattern as current pages)

### Pagination

Page-based, not infinite scroll.

```
Showing 26–50 of 287 people

[ ← ]  [ 1 ]  [ 2 ]  [3]  [ 4 ]  …  [ 12 ]  [ → ]    25 per page ▾
```

---

## GuardianDirectory tab (`/admin/users/guardians`)

### Filters

- **Search:** name or email, ILIKE, debounced

### Table columns

| Name | Email | Linked to | Relationship | Actions (···) |

The "Linked to" cell shows a badge with the count (e.g. "2 students ▾"). Clicking it expands inline to list the linked students with their class and registration number.

### Row expansion (inline)

```
│ Paul Nkemgang  │ p.nkem@…  │ ▾ 2 students  │ Father  │ ···  │
│  → Jean Nkemgang     L2-Info   2024-0041  [Primary]         │
│  → Sophie Nkemgang   L1-Droit  2024-0088                    │
```

### `···` row menu

- Copy portal link (writes the guardian's access-token URL to clipboard)
- Edit preferences (side sheet: notification checkboxes — resultsPublished, attendanceThreshold, feeClearance, documentsAvailable)
- Remove from student (sub-menu listing linked students)
- Delete guardian

### Add guardian sheet

Fields: First name, Last name, Email, Phone, Link to student (searchable select), Relationship type, Primary contact (checkbox), Emergency contact (checkbox).

On success: row appears immediately via cache invalidation. The student search reuses `students.list` — no new query.

### Pagination

Same page-based pattern as PeopleManagement.

---

## Backend changes

### 1. New `users.listPaged` procedure

`users.list` (cursor-based) is used in 9+ call sites across teacher/admin pages for loading dropdown options. It is left **unchanged**. A new sibling procedure `users.listPaged` is added exclusively for PeopleManagement.

**Input:**
```ts
{
  page: number              // 1-indexed, default 1
  pageSize: number          // default 25
  role?: BusinessRole
  status?: DomainUserStatus
  search?: string           // name or email ILIKE, debounced on frontend
  classId?: string          // only applied when role = "student"
  academicYearId?: string   // only applied when role = "student"
}
```

**Output:**
```ts
{
  items: DomainUser[]
  total: number
  pageCount: number
}
```

When `role === "student"`, each item gains three extra fields via LEFT JOIN on `students` and the active `enrollments` row:
```ts
registrationNumber: string | null
currentClassName: string | null
currentEnrollmentStatus: string | null
```

### 2. New `guardians.listAll` procedure

**Input:**
```ts
{
  page: number
  pageSize: number      // default 25
  search?: string       // name or email ILIKE
}
```

**Output:**
```ts
{
  items: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    accessToken: string
    preferences: GuardianPreferences
    studentLinks: Array<{
      id: string
      relationshipType: GuardianRelationshipType
      isPrimary: boolean
      isEmergencyContact: boolean
      student: {
        id: string
        firstName: string
        lastName: string
        registrationNumber: string | null
        currentClassName: string | null
      }
    }>
  }>
  total: number
  pageCount: number
}
```

Uses Drizzle `with: { studentLinks: { with: { student: true } } }` — no N+1.

Existing `guardians.listByStudent`, `guardians.create`, `guardians.updatePreferences` are unchanged.

---

## Routing & Sidebar

### UsersHub HubNav tabs

| Old label | New label | Path |
|-----------|-----------|------|
| Accounts | People | `/admin/users/people` |
| Students | *(removed)* | — |
| Guardians | Guardians | `/admin/users/guardians` |
| API Keys | API Keys | `/admin/users/api-keys` |

### Sidebar

- "Users" entry (people group) → `/admin/users/people`
- "Students" entry (inscriptions group) → `/admin/users/people` (no deep-link role pre-filter; users apply the Student chip themselves)
- "Guardians" entry (inscriptions group) → `/admin/users/guardians`

---

## Out of scope

- Enrollment management actions (assign class, change enrollment status) — these live in ProfileHub → Enrollments tab
- Financial history export — ProfileHub → Finances tab
- Student bulk import / CSV export — separate ticket
- Dean/teacher management-specific features beyond filtering by role
