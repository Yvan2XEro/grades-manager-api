# UX & Feature Gaps — Design Spec

**Date:** 2026-09-10  
**Scope:** TKAMS Secondaire (`apps/secondary`)  
**Source:** test-feedback.md (ENR-01 through ATT-01)  
**Status:** Approved for implementation

---

## Design Principles

Three systemic weaknesses drive nearly all the issues:

1. **Errors are invisible.** Backend errors never reach the user — no toast, no inline message. Fixing this first unblocks many other items.
2. **CRUD is incomplete.** Create works everywhere; Edit and Delete are missing for Tracks, Classes, and several sub-entities.
3. **Workflows are atomized.** Multi-step flows (assignments, grade entry, council decisions) force the user through one form per record when they should operate in bulk.

The spec is ordered to fix the foundation first (error display), then CRUD completeness, then workflow UX.

---

## 0 · Dropdown Menu Rule (sysadmin pages)

**Rule:** In every detail page action area, classify each action before placing it:

| Action type | Where it goes |
|---|---|
| Opens a **real form** (modal with input fields the user must fill) | Direct button in the header — **never in a dropdown** |
| **Direct mutation** (fires immediately, no user input needed) | Dropdown menu |
| Opens a **confirmation-only dialog** (AlertDialog with Confirm/Cancel, no input fields) | Dropdown menu |

A real form means: a dialog or sheet with one or more `<input>`, `<textarea>`, or `<select>` elements that the user fills in before submitting. A simple "Are you sure?" dialog is NOT a real form.

**Applied to sysadmin/user-detail:**
- Dropdown: Send reset email, Toggle platform role, Unban, Revoke sessions (AlertDialog), Delete (AlertDialog)
- Buttons: Edit user info (form), Set password (form), Ban user (form with reason + expiry)

**Applied to sysadmin/institution-detail:**
- Dropdown: Suspend/Reactivate (direct mutations), Delete institution (AlertDialog)
- Buttons: Edit institution (form), Add member (form)

---

## 1 · Global Error Display (ERR-01, CC-01, EXM-01-silent, RC-01-403)

### Problem
Every silent failure in the app has the same root cause: mutations have no `onError` handler. Backend errors (CONFLICT, FORBIDDEN, PRECONDITION_FAILED, etc.) are swallowed and never shown.

### Solution — `useMutationToast` hook

Create `apps/secondary/client/src/hooks/use-mutation-toast.ts`:

```ts
// Thin wrapper: adds onSuccess toast + maps TRPCClientError codes to i18n keys.
// Usage: const { mutate } = useMutationToast(trpc.councils.create, {
//   successKey: 'councils.created',
// });
```

**Error code → i18n key mapping** (add to both `en.json` and `fr.json`):

| TRPC code | i18n key | EN | FR |
|---|---|---|---|
| `CONFLICT` | `error.conflict` | Already exists. | Existe déjà. |
| `FORBIDDEN` | `error.forbidden` | You don't have permission. | Permission insuffisante. |
| `NOT_FOUND` | `error.not_found` | Not found. | Introuvable. |
| `PRECONDITION_FAILED` | `error.precondition` | *(use `error.message` from server)* | *(same)* |
| `UNAUTHORIZED` | — | redirect to `/login` | — |
| anything else | `error.unknown` | An unexpected error occurred. | Une erreur inattendue s'est produite. |

For `PRECONDITION_FAILED`, the server always sends a human-readable `message` — display it directly (already translated by the backend). No key lookup needed.

**Adoption:** Retrofit all existing mutations across all pages. Each mutation gets:
```ts
onError: (err) => errorToast(err, t),
```
where `errorToast` is a standalone function exported from the hook file (so it can also be called in `onError` callbacks that aren't using the wrapper).

**Toast style:** Use `sonner`'s `toast.error()`. Duration: 5 s. No duplicate toasts for rapid retries (debounce by error code + 500 ms).

---

## 2 · Select.Item Crash (UI-01)

### Problem
`<Select.Item value="">` throws a Radix runtime error. This crashes the component tree silently in some places.

### Fix
Grep for `<SelectItem` across all `*.tsx` files in `apps/secondary/client/src`. Any item where `value` could be `""` (empty string) or `undefined` must be:
- Removed if it's meant as a "no selection" placeholder → use `<Select>` `placeholder` prop on the trigger instead
- Given a sentinel string if a real empty-option is needed (e.g. `value="__none__"`) and handled in form logic

Audit the offending component: likely a select populated from an API list where the first item has an empty `id` (e.g., a "Select a track…" item added in JS).

---

## 3 · Track Edit & Delete (TRK-01)

### Backend
Add to `tracks.router.ts`:
- `tracks.update` (adminProcedure): `{ id, name, code, cycleLevel, isOfficial }`
- `tracks.delete` (adminProcedure): `{ id }` — returns `PRECONDITION_FAILED` if any class references this track ("X class(es) are linked to this track. Delete them first.")

### Frontend — Track detail page
- **Edit button** → `EditTrackDialog` (pre-populated, same fields as create)
- **Delete button** → `AlertDialog`:
  - If classes linked: shows error message, no confirm button
  - If no classes: "This action is permanent. The track will be deleted." — confirm button

### ORT-02 — Bulk CSV import outside onboarding
Add an **"Import CSV"** button (secondary style) to the Tracks list page header, next to "Add track". Clicking opens the same step-3 upload panel from the onboarding wizard, as a Sheet. This applies to Subjects and Classes pages too (see §4 and §5).

---

## 4 · Class Edit & Delete (CLS-01)

### Backend
Add to `classes.router.ts`:
- `classes.update` (adminProcedure): `{ id, name, code, level, trackId, room }`
- `classes.delete` (adminProcedure): `{ id }` — returns `PRECONDITION_FAILED` if enrollments exist ("X student(s) are enrolled. Unenroll them first.")

### Frontend — Class detail page
- **Edit button** → `EditClassDialog` (pre-populated)
- **Delete button** → same AlertDialog pattern as tracks

### Classes list — bulk CSV import
Same "Import CSV" button as Tracks. Uses onboarding step-6 CSV format.

---

## 5 · Staff Lifecycle (STF-01)

The current "Edit staff" form opens empty and cannot update Better-Auth credentials. This is architecturally wrong. The fix is to align with Better-Auth's ownership model.

### Ownership model
| Who owns it | Field |
|---|---|
| The staff member themselves | email, password, display name |
| The institution admin | role (teacher / principal / admin), institution phone override, suspension |

### New lifecycle

**Creation (individual or CSV import):**
1. Admin fills name + email + role (+ optional phone)
2. Backend calls Better-Auth `organization.inviteMember(email, role)`
   - If SMTP configured: invitation email sent automatically
   - Always: invitation URL returned
3. If SMTP not configured, UI shows **"Copy invite link"** modal — admin shares it out-of-band
4. Staff record shows status `pending` until they accept

**First login (staff side):**
- Better-Auth invite link → staff sets their own password
- Optionally prompt to complete profile (phone, display name) — this is the Settings page

**What admin sees in Staff detail:**
- Status badge: `Pending invitation` / `Active` / `Suspended`
- Role selector (dropdown — admin can change this)
- Institution phone override (editable by admin, separate from the auth user's phone)
- **Resend invite** button (visible when status is Pending)
- **Remove from institution** button (revokes membership; does not delete the auth account)

**What admin CANNOT see or change:**
- Email (Better-Auth owns it)
- Password (no admin reset — staff uses "Forgot password" from login page)
- Display name (staff owns it via Settings)

**Remove the broken "Edit" form entirely.** Replace with the read-only profile + role selector described above.

### CSV import
Bulk import creates one pending invitation per row. On completion, show a summary:
- `N invitations sent by email`
- `M invite links generated` (shown in a copy-able list when SMTP is off)

### Staff list page — bulk CSV import
Same "Import CSV" button as Tracks. Same CSV format as onboarding step-7.

---

## 6 · Subject Assignments UX (ASG-01)

### Problem
The current form requires one atomic form submission per (teacher × class × subject) triplet. At the start of a school year this is dozens of clicks.

### Two complementary batch views (both mandatory)

#### View A — Teacher-centric (Staff profile → Assignments tab)
Replace the current empty Assignments tab with a batch edit matrix:

```
                  | 4ème D   | 3ème D   |
  ────────────────┼──────────┼──────────┤
  Mathématiques   |  [✓]     |  [ ]     |
  Physique        |  [✓]     |  [ ]     |
  SVT             |  [ ]     |  [ ]     |
```

- Rows = subjects that exist for the institution
- Columns = all classes for the active academic year
- Checkbox = teacher is assigned to teach that subject in that class
- **Save changes** button submits a diff: adds new intersections, removes unchecked ones that existed before
- Only subjects that belong to the class's track coefficient list are shown as active rows for that column (grey out inapplicable cells)

#### View B — Class-centric (Class detail → Assignments tab)
Replace the current Assignments tab with a per-subject teacher picker:

```
  Subject           | Assigned teacher
  ──────────────────┼───────────────────────────
  Mathématiques     | [M. Nkemdirim         ▼]
  Physique-Chimie   | [— select teacher —   ▼]
  Anglais           | [M. Nkemdirim         ▼]
```

- Rows = all subjects in the class's track coefficient list
- Dropdown = searchable list of active staff (teacher role), plus "— Unassigned —"
- **Save changes** button patches the full assignment set for this class

### Data model
No schema change needed. The existing `subjectAssignments` table (`teacherId`, `classId`, `subjectId`, `academicYearId`) covers both views. The batch endpoints are:

**Backend new procedures:**
- `subjectAssignments.batchUpdateForTeacher` (adminProcedure): `{ teacherId, academicYearId, assignments: { classId, subjectId, assigned: boolean }[] }` — upsert/delete based on `assigned` flag
- `subjectAssignments.batchUpdateForClass` (adminProcedure): `{ classId, academicYearId, assignments: { subjectId, teacherId: string | null }[] }` — replace full set for the class

The existing atomic "Add assignment" route remains as-is (used by the two new views internally).

---

## 7 · Grade Entry (GRD-01, GRD-02, GRD-03)

### GRD-01 — Full Grid = Quick Entry (same component)

**Root cause:** Quick Entry uses an inline panel; Full Grid uses a separate expanded table with different columns and footer. They diverged and are now inconsistent.

**Fix:** Create a single `<GradeGrid>` component that renders in two modes:
- `mode="inline"` — compact, shown below the selector bar on the Grades page
- `mode="fullscreen"` — same component, rendered inside a full-width Sheet that slides in from the bottom

Both modes: same column order, same footer (subject average, class average, Save button), same row height. The Sheet's trigger button changes label from "Full Grid" to "Close".

### GRD-02 — Column headers from assessment configuration

Current behavior: columns show "Grade 1", "Grade 2" — meaningless.

Expected: headers come from the assessment type names configured for that term. If the institution has configured `["Devoir 1", "Devoir 2", "Composition"]`, those are the column headers.

**Backend:** `assessments.listTypes` already exists. The grade grid query should include the assessment type label in the response.

**Frontend:** `GradeGrid` receives `columns: { id, label }[]` and renders them as `<th>` cells. Fallback if no types configured: `"Eval. 1"`, `"Eval. 2"`.

### GRD-03 — Comment entry as Sheet (no navigation)

Current behavior: clicking "Comment" navigates to a new route, losing class/subject/term context.

**Fix:** Comment entry opens a **Sheet** (right slide-over) anchored to the current page:
- Sheet header: student name + subject + term
- Body: `<Textarea>` pre-filled with existing comment
- Footer: Cancel + Save
- No route change. Sheet closes after save; grade grid state is preserved.

Remove the standalone comment route (or keep it only as a deep-link fallback).

---

## 8 · Report Cards (RC-01)

### 8.1 — PDF generation permission (403)

**Root cause:** `reportCards.generatePdf` and `reportCards.batchPdf` are likely declared as `adminProcedure` but the frontend calls them with a teacher session, or the org context is missing from the client request.

**Fix:**
- Audit procedure declarations: generatePdf should be `tenantProcedure` (readable by teacher) or `adminProcedure` (admin only) — decide based on requirement. Teachers viewing their own class report cards → `tenantProcedure`.
- Audit the client-side `trpc` call to ensure the org header is included.
- The `batchPdf` (bulk download) is admin-only → stays `adminProcedure`.

### 8.2 — Role-based button visibility

**Fix:** In `ReportCardPreview` component, gate buttons by role:
```tsx
{role === 'admin' && <Button>Validate</Button>}
```
Teacher sees the report card read-only. The validate action is admin-only.

### 8.3 — Print button

**Fix:** Replace `window.print()` with "Open PDF" behavior:
```tsx
<Button onClick={() => window.open(pdfUrl, '_blank')}>Print / PDF</Button>
```
The browser's built-in PDF viewer has a print button. This is the correct pattern — it prints the formatted PDF, not the admin shell.

### 8.4 — "Download all PDFs" → proper ZIP

**Backend:** `reportCards.batchPdf` should:
1. Generate all PDFs for the requested class + term
2. Bundle them in a ZIP using a stream
3. Name each file: `{student_slug}_{class_code}_T{term}.pdf`
4. Return the ZIP as a binary stream with `Content-Disposition: attachment; filename="bulletins_{class_code}_T{term}.zip"`

**Frontend:** The download button triggers a fetch + `URL.createObjectURL` with the ZIP blob.

### 8.5 — Navigation clarity

Current flow is confusing because there's no clear entry hierarchy.

**Canonical flow:**
```
Sidebar: Report Cards
  → List page: select Class + Term → shows rows (one per enrolled student)
  → Row click → Report Card Preview page
      Breadcrumb: Report Cards > [Class name] > Term [N] > [Student name]
      Actions: Print/PDF (opens PDF in new tab), Validate (admin), Download PDF
```

The list page should pre-select the active class and current term as defaults if available.

---

## 9 · Class Councils (CC-01, CC-02)

### CC-01 — Conflict error display

Apply the ERR-01 pattern. The `createCouncil` mutation's `onError` callback shows:
- `CONFLICT` → "A council session already exists for this class and term."

### CC-02 — Auto-assign decisions

**New "Auto-assign" action** in the council detail page (admin only):

1. Button "Auto-assign decisions" in the council toolbar
2. Opens a Dialog with configurable thresholds (pre-filled with MINESEC defaults):

| Threshold | Decision |
|---|---|
| avg ≥ 16.00 | Félicitations |
| avg ≥ 14.00 | Encouragements |
| avg ≥ 12.00 | Tableau d'honneur |
| avg < 8.00 | Avertissement de travail |
| avg < 6.00 | Blâme |

Fields between 8.00–12.00: no auto-decision (manual override).

3. Checkbox: "Overwrite existing decisions" (default: unchecked — preserves manual decisions)
4. "Apply" button calls a new procedure `classCouncils.autoAssignDecisions` that:
   - Computes each student's term average from grades
   - Assigns decisions based on thresholds
   - Skips students with an existing manual decision unless overwrite is checked
5. Page refreshes the student list after apply

**Backend:** `classCouncils.autoAssignDecisions` (adminProcedure): `{ councilId, thresholds: { min, decision }[], overwrite: boolean }`

**i18n:** Threshold labels are hardcoded (MINESEC terminology, not configurable per institution). Thresholds themselves are configurable per run.

---

## 10 · Official Exams (EXM-01)

### Use case (clarified from schema)

Official Exams manage **MINESEC national exam sessions**: BEPC (end of 3ème), PROBATOIRE (end of 2nde), BAC (end of Terminale). This is a real and important feature for Cameroonian schools.

The confusion arose because the UI doesn't enforce eligibility — allowing BAC registration for 4ème students, which is absurd.

### Eligibility rules (hardcoded by MINESEC standard)

| Exam type | Eligible class levels | Series constraint |
|---|---|---|
| BEPC | `3eme` only | No series (BEPC has no series) |
| PROBATOIRE | `1ere` only | Must match session series (e.g. series C → only `1ere` + track code C) |
| BAC | `Tle` only | Must match session series (e.g. series D → only `Tle` + track code D) |

**Backend — `bulkRegisterSchema` validation:**
- When registering candidates via class, validate that the class's level matches the exam type, and that the track code matches the session series (for BAC/PROBATOIRE).
- Return `PRECONDITION_FAILED` with a clear message if ineligible: "BAC Série C only accepts Terminale C students. Class 4ème D is not eligible."

**Frontend — class selector when adding candidates:**
- Only show eligible classes in the class dropdown (filter by level and track code matching the session's exam type and series)
- Ineligible classes are excluded entirely (not just greyed out)

### Session creation form
- When exam type is BAC or PROBATOIRE, show **series selector** (A4, C, D, TI, F3, F4, A5)
- When exam type is BEPC, hide the series field

### Result entry
- Apply ERR-01 pattern to all result mutations: show toast on error
- Result entry should validate 0–20 range and mark `isAdmitted` based on average ≥ 10

### "Official Exams" label in sidebar
Add a short description on the list page: "Manage MINESEC national exam sessions (BEPC, Probatoire, BAC). Register candidates, track fees, record results." This removes the "what is this for?" ambiguity.

---

## 11 · Student Profile & Enrollments (ENR-01, STU-01, STU-02, STU-03)

### STU-01 — Current class visible on profile

Add a **"Current enrollment"** card to the student Profile tab:
- Class name (link to class detail)
- Academic year
- Admission type
- If not enrolled in the active year: "Not enrolled this year" with an "Enroll" button

**Backend:** No new procedure needed — `enrollments.listForStudent` already exists. Filter by active academic year.

### STU-02 — Enrollment history

Add an **"Enrollment history"** section at the bottom of the Profile tab (not a separate tab — it's simple enough):
```
2023-2024  5ème D      New admission
2024-2025  4ème D      Promoted
2025-2026  3ème D      (current)
```
Chronological, newest first. Each row links to the class.

**Backend:** `enrollments.listForStudent` with no year filter — already returns all years.

### ENR-01 + STU-03 — Enroll existing student from Enrollments page

**On the Enrollments page**, alongside "Add student" (which creates a new student), add a second button:
- "Enroll existing student" → opens a Dialog
- Dialog: student search (combobox, search by name or MNU) + class selector + academic year (defaults to active) + admission type
- On submit: calls `enrollments.create` for the selected student

**Rename existing button:** "Add student" → "New student" to make the distinction clear.

---

## 12 · Finance — Payment Reference (FIN-01)

Add a **"Reference / Transaction ID"** field to the payment form:
- Optional text field, max 100 chars
- Label: "Reference" (EN) / "Référence" (FR)
- Placeholder: "MTN-2025-REF001, OM-REF-002, etc."

**Backend:** `finance.recordPayment` already has `feeTransactionRef` in the schema (it exists in `updateRegistrationSchema`). If it's not in the payment-recording mutation, add it.

**Frontend:** Add the field to the payment dialog form.

---

## 13 · Bulk CSV Import on Management Pages (ORT-02)

The onboarding wizard is a one-time flow. After it completes, admins need to be able to import data without re-running onboarding.

Add an **"Import CSV"** secondary button to the header of each list page:

| Page | CSV format |
|---|---|
| Tracks | Same as onboarding step 3 |
| Subjects | Same as onboarding step 4 |
| Classes | Same as onboarding step 6 |
| Staff | Same as onboarding step 7 |

Implementation: extract the CSV upload + validation component from each onboarding step into a reusable `<CsvImportSheet>` component. Both the onboarding step and the list page button use the same component with the same parser.

---

## 14 · Attendance (ATT-01)

**No code change.** Fix the test walkthrough:

- Change step expected result from "shows records" to: "No attendance records yet. Attendance must be taken first — see the Attendance section in the sidebar."
- Add an optional step in the Attendance section of the walkthrough: create a sample attendance record to verify the tab populates correctly.

---

## Implementation Order

| Priority | Items | Rationale |
|---|---|---|
| 1 | ERR-01, UI-01 | Foundation — enables everything else to surface errors |
| 2 | TRK-01, CLS-01, ORT-02 | CRUD completeness — urgent, users are blocked when they make data errors |
| 3 | STF-01 | Staff lifecycle — architectural, invasive, do cleanly |
| 4 | ASG-01 | Highest UX pain point mentioned |
| 5 | GRD-01, GRD-02, GRD-03 | Grade entry — recurring complaint |
| 6 | RC-01 | Report cards — PDF permission is a blocker, rest is UX |
| 7 | CC-01, CC-02 | Councils — CC-01 is trivial, CC-02 is additive |
| 8 | EXM-01 | Official exams — eligibility enforcement |
| 9 | ENR-01, STU-01, STU-02, STU-03 | Student profile — quality of life |
| 10 | FIN-01, ATT-01 | Small additions |
