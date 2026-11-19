# Usability test — November 2026

Non-technical testers used TKAMS against the seeded INSES institution, with concrete goals for each role. This document records what they found, what was fixed and what is still open. All fixes are on `dev`, up to commit `1589200`.

## Method

Three test agents drove a real browser (Playwright) but behaved like users. They navigated only through visible menus and buttons, never by typing URLs, calling the API or reading code. They looked at every screen and wrote down every hesitation, at desktop size (1280×800), at phone size (390×844), and with the interface in English at least once.

| Persona | Account | Goals |
|---|---|---|
| Head of the registrar's office | `admin@inses.cm` | Enroll a late student in a class, take a partial payment and print a receipt, issue an enrollment certificate, import a past year from Excel and undo it, give a new lecturer access and a course, update the institution details printed on documents |
| Lecturer | `dr.mballa@inses.cm` | Find his courses and student lists, see his timetable, enter grades (normal and fast entry, deliberate typos, leaving mid-entry), import grades from Excel, submit grades for approval, print the grade sheet, repeat entry on a phone |
| Dean of studies, then a student | `dean@test.inses.cm`, `student@test.inses.cm` | Dean: overview, approvals, deliberation, promotion, transcript, minutes (PV), statistics. Student (on a phone): grades, fees owed, documents, timetable, profile, forgot password |

Four fix agents then worked on separate git worktrees, one per area: documents, fees and people lists, results and deliberations, and the student and lecturer portal. Every branch was type-checked, tested and merged into `dev`.

**Final state:**
- 501 server tests pass, the web unit tests pass and type checking is clean (web and server).
- A last browser crawl of every page found no errors: 54 admin pages, 28 dean pages and 7 student pages. As lecturer, only the grade-entry pages were flagged, because the page scrolls; that is expected for a long form.

## Blocking problems fixed

| Problem found | Fix |
|---|---|
| A lecturer could never submit grades. The submit button only appeared on a *locked* exam, and an exam can only be locked after approval. | The grade-entry page has **Submit for approval**, for draft, scheduled and rejected exams. The confirmation says what happens next and how many students are still ungraded. A submitted exam shows "Awaiting the dean's approval". |
| On the normal grade-entry page, typing "1,5" saved 15 with no warning. | The decimal comma is accepted, and invalid grades are flagged as you type with a visible message. |
| "View" on a course card opened the course's first exam, not the exam that was clicked. | The card opens the exam that was clicked (`?exam=<id>`). |
| The Excel grade import only filled the form: grades were lost on leaving, and "9,5" was skipped silently. | Imported grades are saved immediately, decimal commas are accepted, and skipped rows are listed with the reason. Closing the tab with unsaved grades asks for confirmation. |
| There was no way to put a student in a class. "Add a student" created a bare person; only the year import worked. | New **Enroll a student** dialog, available from the class Students tab, the Students page and a dashboard quick action. It enrolls either a new student (identity, registration number, student record and enrollment in one step) or a person already registered (no duplicate profile, or moved from their current class). New endpoint: `students.enrollPerson`. |
| There was no enrollment certificate. The only "attestation" was a pass certificate, and it could be issued to a student whose jury decision was pending. | New **enrollment certificate**, from the student file and from batch generation. Pass certificates and diplomas require an admitted or compensated decision from a closed jury, enforced on the server. Students who are not eligible are listed with the reason. |
| Every document carried the same reference number, and the institution phone, slogan and signatory never appeared on documents. | A register of issued documents (`issued_documents` table) gives each document a unique number, e.g. `0001/2026/INSES/SCOL`. Templates now receive the institution contact details and the signatory. |
| The dean's menu had 4 entries, so deliberations were unreachable. A student's file spun forever (403). | The dean has a grouped menu: approvals, programs, classes, students, exams, documents, results, statistics and monitoring. Deans can now read student files. |
| Students had no fees page. | **My fees** page: amounts due, payments, installments with due dates, and receipts. |
| Taking a payment needed a hidden "assign a fee scale" step. | Payments can be recorded from the student's Finances tab or from Student payments. If the student has no fee scale yet, the matching one is assigned in the same step. |
| A PDF failure gave a silent HTTP 500 or a raw Chrome error. | The user gets a translated message, and the technical detail goes to the server log. |

## Wrong numbers fixed

- **Deliberations.** Students with incomplete grades were ranked and given a mention and a decision, for example "rank 7, Très bien, Exclu". They now show as **Incomplete**, with no rank, mention or automatic decision, and a banner lists them before closing.
- **Grade exports.** The course average was a plain mean; it is now weighted by the exam percentages (e.g. CC 40% + final 60%).
- **Dashboard.** The pass rate showed 6% while the deliberations showed 45.8%, and new empty classes showed "14.56 / 100%". The dashboard and the statistics page now use the same definitions, show "—" when there is no data, and explain each figure in a tooltip.
- **Students list.** The "student" filter found 1 person while the dashboard said 238. The list now has a dedicated Students page (`/students`), separate from Users.
- **Minutes (PV) Excel.**
  - The pass rate printed as `0.4583333%`; it is now `45.8 %`.
  - Rows were sorted by first name; they are now sorted by rank.
  - A title and a signature block were added.
- **Promotion.**
  - "Add a class" proposed the same level; it now proposes the next level of the cycle, with a generated code.
  - Promoting twice duplicated enrollments; promotion is now idempotent.
  - The new enrollment was dated with the wrong academic year.
- **Past years.** Past-year class lists and transcripts lost promoted students; they now use the enrollment of that year.
- **Year import.**
  - Course weights could exceed 100% without warning; the preview now warns.
  - The import created a duplicate profile for a person already registered; it now reuses that person.

## Usability improvements

- **Language and formats.** Dates follow the interface language everywhere (`lib/date-format.ts`). Amounts read "250 000 FCFA" (`lib/money.ts`). Roles, statuses, genders, decisions and mentions are translated (`lib/enum-labels.ts`), and French accents and apostrophes were fixed.
- **Search.** Ctrl+K search only lists the pages of the user's role, the same as the sidebar (`components/navigation/nav-menu.tsx`). It also understands synonyms: "attestation", "paiement".
- **Lecturer home.**
  - A semester filter, defaulting to the current semester.
  - Course titles open grade entry, and the student count opens the class list in a dialog.
  - Course pickers show the course name and class instead of internal codes.
  - One page name everywhere: "My courses".
  - The page is about 4 times faster to leave: grade statistics come from one query, and the animated background was removed.
- **Phone.**
  - The help button moved into the header, so no floating button covers "Save" anymore.
  - Menus close after a tap.
  - Grade entry fits a 390 px screen, and the dashboard tiles are readable.
- **Grade entry.**
  - The save bar stays visible once the table is reached.
  - Locked evaluations say why they are read-only and whom to ask.
  - Exams are listed by date.
- **Notifications.** The course lecturer is notified when their grades are approved or rejected.
- **Year import.**
  - The review lists the courses and exams it will create.
  - Undoing a class import after the year was closed gives a clear message instead of a database error.
  - A refused undo closes its dialog.
  - Optional steps are explained.
- **Forgot password.** The confirmation stays on the page, with a resend button.
- **Course assignment.** Only the class's program courses are offered, sorted by name.

## Follow-up fixes

- Unpaid installments past their due date read "Overdue since …" in red on the student fees page.
- Batch documents in demo mode ("Specimen (test print)") carry a SPECIMEN — NOT VALID mark on every page.
- The admin dashboard warns when the active academic year is over and offers to create or activate the next year.
- A new academic year ends the day before the same date of the next year (1 Sept 2026 → 31 Aug 2027).
- The website Docker image no longer downloads Google Fonts during the build: the fonts are bundled in `apps/website/src/fonts`.

## For production

1. **Migrations** are a single drizzle-kit file, `apps/server/src/db/migrations/0000_init.sql`, which includes the register of issued documents (`issued_documents`). An existing database needs that table added before it matches the schema.
2. **INSES student names.** For part of the INSES students, the first and last names are swapped in the source data, so lists sort them on the first name. The seed file is fixed, but existing databases keep the swap. This needs a decision, most likely a re-import of the identities.
3. **PDF engine.** The server's Chromium needs its system libraries (`libatk`, `libcups`, …). In the test sandbox they were missing; the documents agent checked the certificates with Playwright's `chrome-headless-shell` (`PUPPETEER_EXECUTABLE_PATH`).
4. **Test accounts.** The test agents created records tagged `UXA`, `UXB`, `UXC` and `UXZ`, but only in the local database.

## Still open

- The PV, evaluation, EC and UE publication templates receive the institution contact data, but their layout does not use it yet.
- The Cypress end-to-end suite was not run.
- No rendered image of a real PDF was reviewed. The documents were checked as the same HTML at A4 print size, plus the page count of the real PDFs.
- Students without a fee scale make the collection rate partial. The dashboard now states the coverage ("3/238 students with fees").
