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

## Second round: closing the year and moving students up

A non-technical tester playing the head of the registrar's office closed 2025-2026 for one class (SIN-BTS1, 41 students): the jury, the promotion to 2026-2027, the year transition plan, the switch of the active year, then the student's view. A server test now follows one cohort across two years through the public procedures (`academic-year-transitions/__tests__/year-journey.test.ts`): the jury, the next year, promotion, repeaters, the active-year switch, and the final-level jury with graduation.

**What the tester confirmed was right:** the jury's averages (checked by hand), every duplicate path, the promote dialog creating the missing class, and the filters following the active year.

**Fixed:**

| Problem found | Fix |
|---|---|
| The transcript printed only the final-exam mark as NOTE/20, so UE averages looked impossible. "/30" credits, "MOYENNE SEMESTRIELLE" on an annual transcript. | Transcript and jury share one computation (`deliberations/ue-results.ts`). A closed or signed jury's figures are used when one exists. The labels follow the real credit total and scope. Stored templates are upgraded at render time. |
| After the new year was activated, the transcript from the student file printed 2026-2027 over 2025-2026 marks. | The transcript is for a chosen year (default: the latest year with a jury). Its header uses that year's class and level. |
| The student file's Results tab showed "0 / x – In progress" despite a signed jury. | It reads the same year results as the transcript, with a year selector and the jury status. |
| "Promote admitted" left 31 of 41 students with no class in the new year. | The jury page applies every decision in one step. Admitted students are promoted, or graduate on the final level. Repeaters (and deferred students) are re-enrolled at the same level, and their class can be created on the spot. Excluded students are withdrawn. Undecided students are listed and left for the year transition plan. |
| The year transition plan could not be executed once the jury page had promoted some of its students (HTTP 500). | Students already placed in the target year keep their place; the plan runs for the others. |
| Activating a year was one click with no warning. | A confirmation lists classes without a closed jury and students with no class in the new year. The dashboard banner gives the order of the steps. |
| Creating the next year twice gave HTTP 500. | A duplicate year name is a translated conflict message. |
| Cancelling or resolving items in a transition plan did not refresh the screen. | The plan hooks used a second React Query client the pages never read. Cancelling now asks for confirmation. Bulk resolution was added, the reason "Submit" is disabled is shown, and the target-class picker is limited to the program. |
| Promoted students disappeared from the Students list. | A name or registration-number search ignores the year and status filters, and the list shows the student's latest class. |
| Other items. | "Enroll a student" from a class uses that class's year. Jury errors and toasts are translated and specific. The jury president and members can be entered. Jury tiles are consistent. Clicking a student in the jury opens their marks. "View grades" opens the chosen exam. Admins see courses in grade entry. Exam weights that do not add up to 100% are flagged, and retakes no longer count towards 100%. Remaining US date formats were removed. The PV Excel has an "Observations" column with override reasons. |

**Still open:**
- PDF generation needs Chromium's system libraries on the server; in the test sandbox it fails, now with a translated message.
- INSES first and last names are swapped in existing data, including the PV Excel.
- Level names in the data are inconsistent ("BTS Santé 2ème année" vs "BTS 2ème année").

## Third round: LMD cycles and rule-based juries

Two more non-technical testers drove the browser: a registrar following one cohort through Licence 3 → Master 1 → Master 2 → Doctorat 1, and a director of studies setting up the jury rules of the institution. Two server tests follow the same journeys through the public procedures: `academic-year-transitions/__tests__/lmd-cycles.test.ts` and `deliberations/__tests__/rules-journey.test.ts`.

**What the testers confirmed was right:** the jury figures (checked by hand), "Promouvoir et réinscrire" on the last level of a cycle (graduates, repeaters, missing class created on the spot), one person and one registration number across the three cycles, and a rule taking effect at the next computation.

**Fixed:**

| Problem found | Fix |
|---|---|
| The facts a jury rule tests mixed every year of the student: a UE failed two years earlier (or in the previous cycle) set the lowest UE average and the failed-UE counts. | UE, course and credit facts come from the deliberated year's own results (`deliberations/deliberation-facts.ts`). |
| "Excluded after repeating twice" could not work: the repeat counter and the previous decision were hard-coded to 0 / empty. | `consecutiveRepeats` and `previousDeliberationDecision` come from the student's closed juries of earlier years. |
| A rule with a misspelt fact or operator was saved, then silently never matched. | Such rules are refused with the reason. |
| Computing a jury again wiped the jury's manual decisions, while the activity log still showed them. | Overridden decisions and their reason are kept. |
| With rules in place, a student no rule matched still got the built-in decision (compensated against the institution's rules). | Such a student is "to decide by the jury". |
| Rules were raw JSON, with no list of facts, no help and no scope; closing the edit dialog froze the page. | A condition editor in plain words (criterion, comparison, value), help on the order of evaluation with examples, scope by program, level and jury type, an automatic summary, and JSON only as an advanced mode. Menus no longer lock the page after a dialog (`modal={false}`). |
| Nothing said which rule produced a decision. | The results table and the override dialog show the rule and its reason, "default LMD computation", "no rule applies", or the override reason. |
| A Licence graduate could not be sent on to Master 1 from the year transition plan. | The "graduate" outcome takes an optional class: the first-year classes of the other cycles are offered. |
| A diploma could be issued after any favourable jury (an L1 student was "eligible"), and a Master graduate could not get their Licence diploma any more. | Diplomas need a favourable jury on the last level of the cycle; the dialog lists one diploma per completed cycle. The pass certificate of a final year names the degree. "Default option", the untranslated mention and today's date as the jury date were removed from documents. |
| A Licence was awarded with 6 credits out of 180 without a word. | The promote dialog of a last level shows each graduate's credits in the cycle against the cycle's requirement and warns when short. |
| Graduates were called "Admis — vous passez en année supérieure"; the new year's dashboard showed the previous year's figures. | The student portal says "Diplômé(e) — <program>" and shows the current enrollment's figures only. |
| New cycles generated "Level 1 / <CODE>-L1" for Master and Doctorat. | Levels are named after the cycle with a prefix (M1, D1, …); cycles show their code in lists. |
| Enrolling a graduate in Master read as a transfer; "Enroll a student" ignored the filtered year. | The dialog says the student continues with a new enrollment and keeps their history and number; the filtered year is used. |
| Only one year transition plan per pair of years, for one class. | Several plans may coexist when their classes don't overlap (migration `0001_transition_plans_per_class.sql`); a plan can cover several classes; submit, approve and execute ask for confirmation. |
| No exam could be created for a new class: its students were never put on its course lists, and the scheduler reported "Examens programmés" with 0 exams and unexplained conflicts. | Students take their class's courses when they are enrolled, promoted, moved by a year plan, or when a course is added. The scheduler lists each left-out course with the reason; the course picker is limited to the year and searchable. |
| The cycle levels API was not scoped to the institution (any admin could rename another institution's levels). | Every cycle level procedure checks the institution. |

**Still open:**
- Teaching units still store "first half / second half / annual" rather than the class semester catalog (S1–S10).
- The scheduler's left-out courses are shown after a run but not stored with it.
- When a student moves to a sibling class in the same year, their enrollments in courses shared by both classes stay with the old class.
- The local demo rules (seeded before this round) keep their old conditions; the seed script is fixed for new databases.

## Fourth round: security and result integrity

Four audits, each written as failing tests first, then fixed: isolation between institutions (academic structure, then operations), access by role and by record inside one institution, and the integrity of marks around the jury (with retake sessions and semester juries). Tests: `_shared/__tests__/tenant-isolation-structure.test.ts`, `_shared/__tests__/tenant-isolation-operations.test.ts`, `authz/__tests__/access-matrix.test.ts`, `lib/__tests__/auth-org-guard.test.ts`, `deliberations/__tests__/jury-integrity.test.ts`, `cycle-levels/__tests__/cycle-levels.caller.test.ts`, `files/__tests__/upload-types.caller.test.ts`.

**Between institutions (critical holes fixed):**
- Institutions: any admin could list, edit or delete any institution and change its organization, taking over another tenant.
- Cycle levels, notifications (read, acknowledge, send), export templates and their assignments, student course enrollments, credit ledgers: read or written across institutions.
- Batch jobs (credit recompute, student facts, year setup, promotion) could rewrite another institution's data.
- Files: `files.delete` accepted `../` paths; uploads of any type (including HTML) were served from the API origin. Uploads are now per institution, documents and images only, served with `nosniff` and a sandboxing CSP.
- Diplomation REST: `/logo` could read any server file (`.env` included) or fetch any URL; `POST /documents` linked any student.
- Import workbooks were readable by any institution with the file id.
- Document templates: an override or assignment could use another institution's template.

**By role and record:**
- A teacher could edit the marks of any exam (teacher inherited the institution-wide grade-editor rights).
- A student could read another student's marks, credits, course enrollments, student file and enrollments, and every deliberation.
- An administrator could make anyone (themselves included) super admin through the authentication API; a dean could create administrators.
- Diplomation API keys, root institutions: super admin only. Public admission lookup no longer returns the full applicant record.
- The web app sends a student away from any non-student URL.

**Marks and juries:**
- Marks under a closed or signed jury could still be entered, changed, deleted or imported, and exams changed; a locked exam could be unlocked. All refused now.
- A correction after signing goes through an audited path: a super admin reopens the jury, or corrects a mark with a reason. A jury whose marks changed since its computation shows as outdated and can't be closed.
- Retake jury: requires the closed annual jury, deliberates only deferred and undecided students, applies the retake marks only to the retaken exams, and becomes the year's final decision (transcript, diploma, year transition, jury history).
- Semester juries require a semester and never promote; the annual jury combines both semesters.

**Migrations:** regenerated as a single drizzle-kit file, `apps/server/src/db/migrations/0000_init.sql`.

**Still open:**
- Teachers can still list all students, enrollments and exams of the institution (names and numbers, no marks).
- A teacher of one course of a class can export the class PV.
- Reopening a signed jury does not undo a promotion already made.
- No UI yet for the audited mark correction and the edit log (API only).
- Uploaded files are public to whoever has their (unguessable) URL.
- Better-Auth lets any signed-in user create an organization (`allowUserToCreateOrganization`).
