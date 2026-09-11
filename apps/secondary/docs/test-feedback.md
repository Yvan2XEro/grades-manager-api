# Test Walkthrough — Feedback & Issues

Issues discovered while writing/reviewing the test walkthrough document.
Each item needs a decision: fix the code, fix the document, or both.

---

## ENR-01 · Enrollments page — read-only, no enroll action

**Observed:** The Enrollments page (`/enrollments`) is a read-only list. There is no "Enroll" button on it. The only action button is "Add student" which redirects to `/students/new` (student creation).

**Expected (or desired):** A way to enroll an *existing* student into a class directly from the Enrollments page, without having to go through the student's detail page.

**Current workarounds:**
- At creation time: "Add student" form has an optional "Enroll in class" field
- From the student detail page: "Enroll in Class" button (dialog)

**Decision needed:** Add an "Enroll existing student" action on the Enrollments page, or document the current flow as-is?

---

## STU-01 · Student detail — current class not visible

**Observed:** The student detail page (Profile tab) does not show which class the student is currently enrolled in. You cannot tell from the profile which class they belong to this year.

**Expected:** The current class (for the active academic year) should be visible on the profile — at minimum as a field, ideally as a clickable link to the class.

---

## STU-02 · Student detail — no enrollment history

**Observed:** The student detail page has no tab or section showing the student's class history across academic years (e.g. "2023-2024: 5ème D → 2024-2025: 4ème D → 2025-2026: 3ème D").

**Expected:** A chronological list of all classes the student has been enrolled in at this institution, grouped by academic year. Useful for tracking progression, repeating years, transfers.

**Decision needed:** Add an "Enrollment history" section to the Profile tab, or a dedicated "History" tab?

---

## STU-03 · "Add student" flow confusing for existing students

**Observed:** From the Enrollments page, the only button says "Add student" and redirects to student *creation*. If the student already exists and just needs to be enrolled in a class, the user has to navigate away to find the student, open their detail, then use the "Enroll in Class" dialog. This is not discoverable.

**Expected:** The Enrollments page (or the "Enroll" flow) should allow selecting an *existing* student by name/MNU and assigning them to a class — without recreating them.

---

## DOC-01 · Test walkthrough accuracy

Once the above code issues are decided/fixed, update the test walkthrough document accordingly:
- Section 4 (Enrollments): reflect the actual enroll flow
- Section 3 (Students): clarify that "Add student" is for new students only; existing students use the detail page

---

## ORT-01 · Mixed institution context — no "switch back" instruction

**Observed:** The test walkthrough document mixed data from two institutions:
- The onboarding wizard runs on a new empty institution ("Collège Test Onboarding")
- All subsequent tests should run on the seeded institution ("Lycée Bilingue de Yaoundé")
But there was no explicit instruction to switch organization after completing onboarding.

**Fix applied:** Added a prominent warning banner after Section 2 instructing the user to switch back to "Lycée Bilingue de Yaoundé" before continuing.

---

## ORT-02 · Onboarding Settings access doesn't allow re-importing data

**Observed:** After the onboarding wizard completes, accessing it from Settings shows the wizard in a read-only/completed state. You cannot re-run bulk CSV imports from there.

**Expected / workaround:** To add more tracks, subjects, classes, or staff after initial onboarding, users must use the individual management pages in the sidebar (Tracks, Subjects, Classes, Staff).

**Decision needed:** Should the individual management pages (Tracks, Subjects, Classes) expose CSV bulk import similar to the onboarding wizard? This would remove the need to do everything during onboarding.

---

## ORT-03 · Track "Scientifique (C)" does not exist in seed

**Observed:** The test walkthrough referenced track "Scientifique (C)" (code C) in multiple sections. The seed only creates one track: "Série D – Sciences" (code SERIE-D). Any test involving "Terminale C" was impossible to reproduce on the seeded institution.

**Fix applied:** All references to "Scientifique (C)" replaced with "Série D – Sciences", and all "Terminale C" references replaced with "4ème D" (the seeded class).

---

## TRK-01 · Track detail page — no edit or delete actions

**Observed:** The Track detail page (`/tracks/:id`) is read-only. No Edit or Delete button.

**Decision needed:** Add Edit and Delete actions. Delete should warn if classes are linked.

---

## CLS-01 · Class detail page — no edit or delete actions

**Observed:** Same problem as TRK-01. Once a class is created with an error (wrong name, wrong level, wrong track), there is no way to fix it.

**Decision needed:** Add Edit and Delete to the class detail page. Same guard as tracks: warn if students are enrolled.

---

## STF-01 · Staff form pre-fills nothing on edit — Better-Auth ownership issue

**Observed:** Clicking "Edit" on a staff member opens the form completely empty instead of pre-populating with existing data.

**Root cause (design question):** Staff members are Better-Auth users. The institution admin likely doesn't have the right to change their email/password/name — that belongs to the user themselves. Pre-populating is therefore misleading: the admin can't actually update those fields server-side.

**Proposed approach:** Align with Better-Auth model:
- Staff are created via **invitation** (email sent, staff sets their own password on first login)
- If already active, the admin can only **suspend** them from the institution (remove membership) — not edit their credentials
- Staff manage their own profile (name, password, phone) from their Settings page
- The staff "Edit" form in the admin UI should either be removed or limited to institution-specific fields (role, phone override)

**Open question:** For staff imported via bulk CSV, how is the initial password set? Are invitation emails sent? If the mail server is not configured, staff have no way to log in.

**Decision needed:** Define the exact staff lifecycle: invitation flow, first-login password setup, what the admin can and cannot change.

---

## ASG-01 · Subject assignment UX — form never asks for class, atomic creation is painful

**Observed:** The "Add assignment" form only asks for teacher + subject, never for class. Creating assignments atomically (one teacher × one class × one subject at a time) is extremely tedious, especially at the start of a school year.

**Also observed in doc:** The walkthrough asks to assign Physics to M. Nkemdirim, but the only Physics subject created during onboarding was deleted afterwards (in the delete test), making it impossible to assign.

**Expected UX (two complementary views):**
1. **From teacher profile → Assignments tab:** list all classes; for each class, check/uncheck which subjects they teach. Save as a batch.
2. **From class detail → Assignments tab:** for each subject in that class's track, select the teacher from a dropdown. Save as a batch.

**Decision needed:** Choose which view(s) to build first, and the right data model for batch assignment.

---

## GRD-01 · Full Grid ≠ Quick Entry — recurring issue, not fixed

**Observed:** The "Full Grid" grade entry view still uses a different table layout and different footer from the standard grade view. This discrepancy has been raised multiple times in previous sessions.

**Decision needed:** The Full Grid should be pixel-identical to the regular grade table (same columns, same row structure, same action footer). Treat as a blocking UX regression.

---

## GRD-02 · Grade table columns "Grade 1 / Grade 2" are not self-explanatory

**Observed:** The grade grid shows columns named "Grade 1", "Grade 2", etc. It is not clear to the user what these represent (sequence numbers? Assessment types? Terms?).

**Decision needed:** Rename columns to reflect what they actually are (e.g. "Devoir 1", "Composition", "CC1", "Exam" — whatever the configured assessment types are). Column headers should come from the assessment configuration.

---

## GRD-03 · Comment entry loses navigation context — no breadcrumb

**Observed:** Clicking to enter a comment on a grade takes the user to a new page/view with no breadcrumb back to the grade entry context. After saving the comment, the user must re-select class, subject, and term from scratch.

**Expected:** Either a slide-over/modal for comment entry, or a breadcrumb that restores the previous selection state.

---

## RC-01 · Report cards UX — incomprehensible flow, PDF forbidden, print prints HTML

**Observed (multiple issues):**
1. **Navigation is unclear:** The path to view a student's report card is not intuitive. Multiple clicks with no clear labels.
2. **PDF download → 403:** `POST /trpc/reportCards.batchPdf` returns Forbidden. `reportCards.generatePdf` also fails with a permission/routing error.
3. **Preview page shows wrong buttons:** When logged in as a **teacher**, the "Validate (Admin)" button is shown — it should be hidden or disabled with a clear "admin only" label.
4. **Print button prints the HTML page** (browser print dialog on the current page), not the formatted report card. In practice this is useless.
5. **"Download all PDFs"** downloads a malformed/wrong document instead of a `.zip` of individually named PDF files.

**Decision needed:** Prioritize: (a) fix PDF generation permission, (b) fix role-based button visibility, (c) implement proper zip download, (d) redesign navigation flow.

---

## CC-01 · Class council conflict — silent failure on duplicate

**Observed:** When trying to create a class council session that conflicts with an existing one (same class, same term), the action fails silently. No error message, no toast, nothing. The user doesn't know whether their action was ignored or succeeded.

**Root cause:** Backend error not surfaced to the UI. See also ERR-01 (global error display pattern).

---

## CC-02 · Student decision UX — fully manual, no automation

**Observed:** Entering council decisions requires opening each student individually, selecting a decision (Encouragements, Félicitations, etc.), and saving one by one.

**Expected:** A rules-based automation:
- Admin configures thresholds (e.g. avg ≥ 16 → Félicitations, avg ≥ 14 → Encouragements, avg < 10 → Avertissement de travail)
- System auto-assigns decisions based on term average
- Individual override remains available for exceptional cases

**Decision needed:** Build an "Auto-assign decisions" action with configurable thresholds, leaving individual override as the exception.

---

## EXM-01 · Official exams — track/level scoping not enforced

**Observed:**
1. An official exam (BAC) appears to be scoped to a single track/series — but this is not clearly communicated in the UI.
2. When creating a BAC session, the system allows adding students from 4ème D or 5ème — classes that are clearly not eligible for the BAC. No validation prevents this.
3. Once a student is added, saving their result fails silently (no error shown to user).

**Open question:** What is the intended use case for "Official Exams" in this context? Is it for managing external MINESEC exams (BAC, BEPC), internal final exams, or both? The scope and rules need to be defined clearly before fixing the UX.

**Decision needed:** Define eligibility rules (which levels can sit which exam), enforce at the UI level, and display errors properly.

---

## ERR-01 · Backend errors never displayed to the user — global issue

**Observed:** Across many features (exam result entry, council conflict, PDF generation, etc.), backend errors fail silently. No toast, no inline message, nothing. When errors do appear somewhere they are likely in English with no i18n.

**Expected pattern:** Every tRPC mutation should:
1. Catch errors in the `onError` callback
2. Display a toast or inline message using the i18n key for the error code
3. Map known error codes (CONFLICT, FORBIDDEN, NOT_FOUND, PRECONDITION_FAILED) to user-friendly translated messages
4. Fall back to a generic "An error occurred. Please try again." for unknown errors

**Decision needed:** Implement a shared error handling utility (e.g. `useMutationWithErrorToast`) used consistently across all mutations.

---

## UI-01 · Select.Item empty value crash — console error

**Observed:**
```
Uncaught Error: A <Select.Item /> must have a value prop that is not an empty string.
This is because the Select value can be set to an empty string to clear the selection
and show the placeholder.
    SelectItem select.tsx:1278
```

**Root cause:** At least one `<Select.Item>` in the app is receiving `value=""` (empty string). This is a Radix UI constraint — placeholder/"select an option" items must not be rendered as `<Select.Item>`; use `<Select.Trigger>` placeholder prop instead.

**Decision needed:** Audit all Select usages, find the empty-value item(s), and fix.

---

## FIN-01 · Payment form — "Reference" field does not exist

**Observed:** The test walkthrough asks to fill a "Reference" field (e.g. "MTN-2025-REF001") when recording a payment. This field does not exist in the actual Finance payment form.

**Fix needed:** Either add a Reference/Transaction ID field to the payment form, or update the test walkthrough to remove it.

---

## ATT-01 · Attendance tab shows empty for seeded students

**Observed:** The test walkthrough states Élisée Talla's Attendance tab should show records. In practice it is empty — no entries exist because attendance was never recorded (there is no step in the walkthrough that creates attendance records).

**Root cause:** The seed does not create any attendance records. The walkthrough step was written assuming pre-existing data that doesn't exist.

**Fix in walkthrough needed:** Either add a step to create attendance records, or change the expected result to "No entries yet — attendance must be taken first."

---

*Last updated: 2026-09-10*
