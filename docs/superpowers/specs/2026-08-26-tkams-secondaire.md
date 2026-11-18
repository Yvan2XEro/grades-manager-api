# TKAMS Secondaire — Product Spec

_Date: 2026-08-26, Version: 2.1_

---

## 1. Product Overview

### What this is

TKAMS Secondaire is a lightweight SaaS school management platform for Cameroonian secondary schools (collèges and lycées). It handles the full administrative lifecycle: student enrollment, trimester grading, report card generation, parent communication, school fees, and official exam (BEPC/BAC) candidate management.

It is **not** an extension of TKAMS Supérieur. It shares only the auth infrastructure and tech stack. The domain model, module structure, and UX are completely independent.

### Design principles

- A school administrator should be able to set the system up in one day.
- Teachers enter grades; the system computes averages, ranks, and report cards automatically.
- Parents are contacts only — their phone/email is stored on the student record for outbound SMS/email notifications. No parent login.
- No batch jobs. No approval workflow chains. No credit ledgers. No LMD machinery.
- Scope matches what EcoTech, Akademise, and GEDEON offer — plus deeper MINESEC compliance.

### Target users

| Role | Description |
|---|---|
| Admin / Scolarité | School secretary — manages enrollments, fees, report card lifecycle |
| Principal / Vice-Principal | Direction — signs report cards, validates class councils |
| Teacher | Enters grades, records attendance, writes student comments |

Only these three roles log into the system. Parents and students do not have accounts. Parents receive outbound notifications (SMS, email) only.

### Shared with TKAMS Supérieur (auth infra only)

- Better-Auth (user accounts, organizations, sessions, RBAC via `createAccessControl`)
- `notifications` module (email/SMS pipeline)
- File storage abstraction
- Bun + Hono + tRPC + Drizzle + React + shadcn/ui + TailwindCSS v4 stack

Everything else is built from scratch.

---

## 2. Cameroon Secondary School System (MINESEC Reference)

### 2.1 Assessment types and weightings

**6-sequence mode** (dominant — recommended by MINESEC since 2010):
- 6 sequences per year, 2 per term (T1 = S1+S2, T2 = S3+S4, T3 = S5+S6)
- Subject average per term = (odd_sequence + even_sequence) / 2
- All sequences carry equal weight

**Composition mode** (still used in some schools):
- Per term: Composition (end-of-term exam), one or two Devoirs sur Table / DST (in-class test), optionally Interrogation (short quiz)
- Standard formula: `subject_avg = (COMP × 3 + DST × 2 + INTERRO × 1) / 6`
- Variant: COMP 60%, DST 30%, INTERRO 10%

The school configures which mode applies at the institution or class level. Both modes must be supported.

### 2.2 Coefficients by track

Coefficients are set by MINESEC decree per track (filière) and per cycle level.

**Second cycle (BAC) — main tracks:**

| Subject | A4 | C | D | G2 |
|---|---|---|---|---|
| French / Literature | 6 | 4 | 3 | 3 |
| Philosophy | 5 | 3 | 2 | — |
| History | 4 | 2 | 2 | 2 |
| Geography | 4 | 2 | 2 | 2 |
| English (LV1) | 3 | 2 | 1 | 2 |
| LV2 (Spanish/German) | 2 | — | — | — |
| Mathematics | — | 7 | 4 | 3 |
| Physics-Chemistry | — | 6 | 4 | — |
| Life & Earth Sciences | — | 4 | 4 | — |
| Computer Science | — | — | — | 3 |
| Accounting | — | — | — | 5 |
| Economics | — | — | — | 3 |
| Physical Education | 1 | 1 | 1 | 1 |
| **Total** | **25** | **31** | **23** | **24** |

**First cycle (BEPC):**

| Subject | Coefficient |
|---|---|
| French | 4 |
| Mathematics | 4 |
| History-Geography | 3 |
| Sciences (Physics-Chemistry + Life Sciences) | 3 |
| English | 2 |
| Physical Education | 2 |

The system must support custom coefficient overrides per institution (internal trimester grids may differ from official OBC exam coefficients).

### 2.3 Average formulas

```
# Subject term average (6-sequence mode)
subject_avg_T1 = (grade_S1 + grade_S2) / 2

# Subject term average (composition mode)
subject_avg = (end_of_term_exam × 3 + class_test × 2 + quiz × 1) / 6

# Overall term average (coefficient-weighted)
term_average = Σ(subject_avg_i × coeff_i) / Σ(coeff_i)

# Annual average
annual_average = (term_average_T1 + term_average_T2 + term_average_T3) / 3
```

**Rank:** computed over students present in at least one assessment. Tie-breaking: (1) French grade, (2) Mathematics grade, (3) alphabetical. Format: `3rd / 38`.

### 2.4 Trimester report card — exact columns

**Header:** School name, academic year, student full name, date/place of birth, class, enrollment count, term number, MNU.

**Subject table (one row per subject):**

| Subject | S1 | S2 | Subject Avg /20 | Coeff | Points (Avg×Coeff) | Subject Rank | Teacher Comment | Class Max | Class Min | Class Avg |

_In composition mode: End-of-Term / Class Test / Quiz columns replace S1 / S2._

**Footer block:**

```
Total Points         = Σ(subject_avg × coeff)
Total Coefficients   = Σ(coeff)
Term Average         /20, 2 decimal places
General Rank         = N°X / Y (Y = present students)
Absence Hours        = total justified + unjustified
Mention              = [Below Average | Passing | Good | Very Good | Excellent | Outstanding]
Decision             = [T1/T2: provisional] [T3: definitive]
Class council note   = free text from council
Conduct observation  = disciplinary note if any
```

**Signature areas:** teacher list, vice-principal stamp, principal signature, parent signature + return date.

### 2.5 Class council decisions

| Decision | Condition |
|---|---|
| Admitted | Annual average ≥ 10/20 |
| Admitted with commendation | Average ≥ 12/20, good conduct |
| Admitted with distinction | Average ≥ 14/20, council vote |
| Honour roll | Average ≥ 16/20 |
| Conditional pass | 9.50–9.99, single positive council vote |
| Deferred (repeat authorized) | 8.50–9.49, max once per cycle |
| Mandatory repeat | < 8.50 or second repeat in same cycle |
| Expulsion | Very low average + conduct grounds |
| Warning | Recorded on report card |
| Reprimand | Heavier sanction, filed in student record |

T1 and T2 decisions are provisional. T3 is the definitive annual council.

### 2.6 Mention thresholds

| Mention | Range |
|---|---|
| Below Average | < 10/20 |
| Passing | 10 – 11.99 |
| Good | 12 – 13.99 |
| Very Good | 14 – 15.99 |
| Excellent | 16 – 17.99 |
| Outstanding | ≥ 18/20 |

### 2.7 Official exams

**BEPC** (Brevet d'Études du Premier Cycle — First Cycle Certificate)
- Level: end of 3e (4 years of collège)
- Organiser: MINESEC / OBC
- Pass: average ≥ 10/20
- Institution responsibilities: compile candidate list (MNU, civil status, photo), check fee payment, distribute convocations, relay results

**Probatoire**
- Level: end of Première (1re)
- Organiser: OBC
- Pass: average ≥ 10/20 → access to Terminale
- Coefficients differ from internal trimester grid

**Baccalauréat (BAC)**
- Level: end of Terminale (Tle)
- Organiser: OBC (officedubac.cm)
- CCF: practical EPS and subject grades entered by institution on OBC platform before written exams
- Pass: average ≥ 10/20; jury redemption possible 8–10

### 2.8 Academic calendar (2025–2026 model)

| Period | Dates |
|---|---|
| **Term 1** | 8 Sept 2025 → 28 Nov 2025 |
| Term 1 class councils | Late Nov – early Dec 2025 |
| Christmas break | 19 Dec 2025 → 5 Jan 2026 |
| **Term 2** | 5 Jan 2026 → 6 Mar 2026 |
| Term 2 class councils | Mid-March 2026 |
| Easter break | 2–20 April 2026 |
| **Term 3** | 9 Mar 2026 → 12 Jun 2026 |
| Official written exams | Mid-May → end of June 2026 |
| Term 3 class councils | End of June 2026 |

### 2.9 National school card (MNU)

Since 2024, MINESEC requires a Matricule National Unique (MNU) assigned from 6e on cartescolaire.cm. The MNU:
- Is mandatory on every official exam registration
- Requires fee payment via MTN MoMo, Orange Money, or Campost
- Must be submitted to MINESEC before 15 December each year
- Institution responsibilities: submit name, date/place of birth, gender, parent contacts, class, MINESEC institution code

---

## 3. Competitive Analysis

### 3.1 Competitor overview

| Competitor | Key features | Pricing | Strengths | Weaknesses |
|---|---|---|---|---|
| **EcoTech Solutions** | Grades, report cards, fees, timetable, attendance, discipline | Free plan + opaque paid | Free plan, MINESEC guides, strong Cameroon SEO | Opaque paid pricing, no bilingualism, no parent mobile app |
| **Akademise School** | Grades, PDF report cards, timetable, attendance, push notifications, Mobile Money | Opaque XAF, free trial | Mobile-first, Mobile Money, 120+ institutions, WhatsApp support | No MINESEC integration, opaque pricing, deliberations undocumented |
| **GEDEON / Sicolo** | Bilingual report cards, mass SMS, payment receipts, payroll, transport, rankings | Local licence (not published) | Bilingual FR/EN, parent SMS, longevity | Dated architecture, not cloud-native, no Mobile Money for online payment |
| **Wacni** | Online grades, real-time performance, enrolments, staff, timetable, notifications | Opaque, probable SaaS | Native bilingualism, modern interface | Little public info, no MINESEC compliance documented |
| **AppAcademia** | Grades, PDF report cards, timetable, fees, attendance, AI tutor | 5,000–20,000 XAF/student/year | AI tutoring, Mobile Money, mobile app | AI complexity misaligned for admin tool; expensive at scale |
| **RosarioSIS** | Grades, report cards, timetable, attendance, billing, discipline, Moodle | Free (open source, self-hosted) | Completely free, multilingual, Moodle | Requires IT team; no MINESEC adaptation; no Mobile Money |
| **ProsoftAfrica** | Grades, rankings, report cards, school cards with photo, fees in FCFA, Mobile Money, offline | Annual or lifetime (opaque, WhatsApp) | Offline mode, lifetime licence, Mobile Money, school cards | Opaque pricing, no MINESEC compliance, low brand awareness |

### 3.2 Must-have features

All significant competitors offer these. Their absence is disqualifying:

1. Grade entry and automatic weighted average computation
2. Custom PDF report card generation (official MINESEC format)
3. School fee management and payment receipts
4. Parent communication — SMS and/or email notifications
5. Attendance and absence tracking
6. Weekly timetable per class
7. Mobile Money integration (MTN MoMo, Orange Money)
8. Bilingual French/English interface
9. Student enrollment and records management
10. Ranking per class per term

### 3.3 TKAMS differentiators

1. **Deep MINESEC compliance**: MNU field, cartescolaire.cm export, OBC candidate list generation — no competitor documents this natively
2. **Structured class council module**: draft → held → signed lifecycle, per-student decision grid, PV export — competitors stop at report card generation
3. **Structured class council module**: draft → held → signed lifecycle, per-student decision grid, PV export — most competitors stop at report card generation
4. **Transparent public pricing in XAF**: pricing opacity is the near-universal competitor weakness
5. **Native bilingualism**: report cards generatable per student in French or English, essential for anglophone/francophone mixed networks
6. **Lifetime licence option**: only ProsoftAfrica offers this; TKAMS publishes a clear grid

---

## 4. Module Architecture

### 4.1 Module list

16 modules. Each has a single clear responsibility. None depend on TKAMS Supérieur domain modules.

| # | Module | Responsibility |
|---|---|---|
| 1 | `academic-years` | School year lifecycle (open, close, archive) |
| 2 | `tracks` | Tracks (filières: A4, C, D, G2, F, TI…) + official MINESEC coefficient grids per subject × track × level |
| 3 | `classes` | Class groups (6e A, 5e B, Tle C…) linked to level, track, and academic year |
| 4 | `subjects` | Subject catalogue (Maths, French, Physics…) with MINESEC codes |
| 5 | `students` | Student records — MNU, photo, civil status; includes parent contact fields (`contact_name`, `contact_phone`, `contact_email`, `contact_relation`) for outbound notifications only |
| 6 | `staff` | Teacher and admin staff profiles — subject specialities, roles |
| 7 | `enrollments` | Student enrolled in a class for an academic year |
| 8 | `subject-assignments` | Teacher assigned to a subject for a class in a year |
| 9 | `terms` | 3 academic terms per year — dates, status (open / closed) |
| 10 | `assessments` | Grade entry: student × subject × assessment type × term. Auto-triggers average recomputation |
| 11 | `report-cards` | Trimester report card generation, validation lifecycle, PDF export, print |
| 12 | `class-councils` | Council session per class per term — lifecycle, per-student decisions, PV generation |
| 13 | `attendance` | Roll call per session, per-student absence totals by term, parent SMS alert triggers |
| 14 | `finance` | Tuition and APE fee schedules, payment recording, overdue tracking, receipts |
| 15 | `official-exams` | BEPC / Probatoire / BAC candidate registration, eligibility checks, convocations, result entry |
| 16 | `notifications` | Email and SMS messaging to parent contacts and staff |

### 4.2 Key tRPC procedures per module

**`academic-years`**
```ts
academicYears.list()
academicYears.create({ name, startDate, endDate })
academicYears.setActive({ id })
academicYears.close({ id })
```

**`tracks`**
```ts
tracks.list({ institutionId })
tracks.create({ name, code, cycleLevel })  // "Terminale C", "3e", "Seconde"
tracks.upsertCoefficient({ trackId, subjectId, levelId, coefficient, isOfficialExamSubject })
tracks.bulkUpsertCoefficients({ entries })
tracks.getCoefficientsGrid({ trackId, levelId })
tracks.importOfficialGrid({ trackCode, levelCode })  // loads official MINESEC defaults
```

**`classes`**
```ts
classes.list({ academicYearId })
classes.create({ name, code, academicYearId, trackId, levelId, roomId, classMasterId })
classes.getRoster({ classId })
classes.getStats({ classId, termId })
```

**`subjects`**
```ts
subjects.list({ institutionId })
subjects.create({ name, code, minesecCode, subjectGroup })
subjects.getForClass({ classId })
```

**`students`**
```ts
students.list({ academicYearId, classId? })
students.create({ firstName, lastName, dateOfBirth, placeOfBirth, gender, mnu?, photo? })
students.get({ id })
students.update({ id, ...fields })
students.setMNU({ id, mnu })
students.search({ query })
```

**`staff`**
```ts
staff.list({ institutionId })
staff.create({ firstName, lastName, role, email, subjects: string[] })
staff.update({ id, ...fields })
```

**`enrollments`**
```ts
enrollments.create({ studentId, classId, academicYearId, admissionType })
enrollments.bulkCreate({ classId, studentIds, academicYearId })
enrollments.transfer({ studentId, fromClassId, toClassId })
enrollments.getForClass({ classId })
enrollments.getForStudent({ studentId, academicYearId })
```

**`subject-assignments`**
```ts
subjectAssignments.assign({ staffId, subjectId, classId, academicYearId })
subjectAssignments.unassign({ id })
subjectAssignments.getForClass({ classId })
subjectAssignments.getForTeacher({ staffId, academicYearId })
```

**`terms`**
```ts
terms.list({ academicYearId })
terms.create({ academicYearId, name, code, orderIndex, startDate, endDate })
terms.open({ id })
terms.close({ id })  // locks all grade entry for this term
terms.getActive({ academicYearId })
```

**`assessments`**
```ts
assessments.getForClass({ classId, termId, subjectId })
assessments.upsert({ studentId, classId, subjectId, termId, assessmentType, value, isAbsent? })
assessments.bulkUpsert({ entries })
assessments.getTermSummary({ classId, termId, subjectId })  // averages + ranks per subject
assessments.getStudentTermSummary({ studentId, classId, termId })  // all subjects
assessments.lock({ classId, termId, subjectId })
```

Assessment types enum: `sequence_1 | sequence_2 | sequence_3 | sequence_4 | sequence_5 | sequence_6 | end_of_term_exam | class_test | quiz`

**`report-cards`**
```ts
reportCards.generate({ studentId, classId, termId })
reportCards.generateForClass({ classId, termId })  // one per enrolled student
reportCards.get({ studentId, termId })
reportCards.getForClass({ classId, termId })
reportCards.validate({ id, role: 'admin' | 'vice_principal' | 'principal' })
reportCards.publishBatch({ classId, termId })  // marks ready for printing
reportCards.getPDF({ id })
```

**`class-councils`**
```ts
classCouncils.create({ classId, termId })
classCouncils.schedule({ id, scheduledAt, presidentId, secretaryId })
classCouncils.markHeld({ id })
classCouncils.setDecision({ councilId, studentId, decision, comment, absenceHours })
classCouncils.bulkSetDecisions({ councilId, decisions })
classCouncils.sign({ id, pvPath })
classCouncils.getPVExportData({ id })
classCouncils.list({ classId, academicYearId })
```

**`attendance`**
```ts
attendance.createSession({ classId, subjectId, date, startTime, endTime })
attendance.recordRoll({ sessionId, records: { studentId, status, justification? }[] })
attendance.getTermSummary({ studentId, classId, termId })
attendance.getClassReport({ classId, termId })
```

**`finance`**
```ts
finance.setFeeSchedule({ academicYearId, tuitionAmount, apeAmount, installments })
finance.getFeeSchedule({ academicYearId })
finance.recordPayment({ studentId, academicYearId, amount, type, method, reference })
finance.getStudentBalance({ studentId, academicYearId })
finance.getOutstanding({ academicYearId, classId? })
finance.generateReceipt({ paymentId })
```

**`official-exams`**
```ts
officialExams.createSession({ type: 'BEPC' | 'PROBATOIRE' | 'BAC', academicYearId, centerCode })
officialExams.registerCandidate({ sessionId, studentId, candidateNumber? })
officialExams.bulkRegister({ sessionId, classIds })  // registers all eligible students
officialExams.checkEligibility({ sessionId, studentId })  // fees paid? MNU set?
officialExams.getRegistrations({ sessionId })
officialExams.exportCandidateList({ sessionId })  // PDF + CSV for OBC
officialExams.recordResult({ registrationId, admitted, mention })
officialExams.publishResults({ sessionId })
```

**`notifications`**
```ts
notifications.send({ recipientIds, channel: 'email' | 'sms' | 'in_app', title, body })
notifications.sendToClass({ classId, channel, title, body })
notifications.sendToParents({ classId, channel, title, body })  // all guardians in class
```

---

## 5. Complete Screen Inventory

### Admin / Scolarité

| Path | Title | Description | Components | P |
|---|---|---|---|---|
| `/s/dashboard` | Dashboard | KPIs: active students, report cards published, outstanding fees, upcoming councils | KPI cards, activity feed, quick actions | P0 |
| `/s/students` | Students | Directory: search, filter by class/year | Table, search, filters, export | P0 |
| `/s/students/new` | Enroll Student | New student form | Form, photo upload, parent contact fields | P0 |
| `/s/students/:id` | Student Profile | Full dossier: grades, fees, attendance history | Tabs: Profile / Grades / Fees / Attendance | P0 |
| `/s/classes` | Classes | All classes for current year, with enrollment counts | Table, new class button | P0 |
| `/s/classes/:id` | Class Details | Roster, subject assignments, term progress | Roster table, subject-teacher grid | P0 |
| `/s/tracks` | Tracks & Coefficients | Track list, coefficient grids per track × level | Editable coefficient matrix | P0 |
| `/s/subjects` | Subjects | Subject catalogue with MINESEC codes | Table, add/edit | P0 |
| `/s/staff` | Staff | Teachers and admin profiles, subject assignments | Table, search | P0 |
| `/s/staff/:id` | Staff Profile | Profile, assigned subjects/classes | Tabs: Profile / Assignments | P0 |
| `/s/subject-assignments` | Subject Assignments | Teacher × subject × class grid for current year | Matrix table, assign dialog | P0 |
| `/s/terms` | Terms | Three terms: dates, status, open/close actions | Term cards with status badge | P0 |
| `/s/grades` | Grade Entry | Select class + subject + term, enter grades in spreadsheet grid | Grade grid, lock button | P0 |
| `/s/grades/:classId/:subjectId/:termId` | Grade Grid | Inline editable grade sheet for one subject/term | Spreadsheet table, save, lock | P0 |
| `/s/report-cards` | Report Cards | Select class + term, generate/publish batch | Class selector, term selector, generate button, status table | P0 |
| `/s/report-cards/:classId/:termId` | Class Report Cards | All report cards for a class/term with lifecycle status | Table: student / status / actions | P0 |
| `/s/report-cards/:id` | Report Card Preview | Preview a single report card before publishing | Report card layout, validate/sign actions | P0 |
| `/s/class-councils` | Class Councils | All councils: status, upcoming dates | Table with status badges | P1 |
| `/s/class-councils/new` | Create Council | Create a council session for a class/term | Form | P1 |
| `/s/class-councils/:id` | Council Session | Enter per-student decisions, council note | Decision table, class stats panel | P1 |
| `/s/attendance` | Attendance | Class-level absence summary, daily roll call | Calendar view, class summary | P1 |
| `/s/attendance/:classId` | Class Attendance | Daily roll call by session | Session list, roll call modal | P1 |
| `/s/finance` | Finance | Fee schedule, collection dashboard, overdue alerts | KPI row, payment chart | P1 |
| `/s/finance/students` | Student Fees | Per-student fee status, payment history | Table: student / balance / actions | P1 |
| `/s/finance/record` | Record Payment | Log a manual payment or Mobile Money receipt | Form | P1 |
| `/s/timetable` | Timetable | Weekly timetable editor per class | Weekly grid, drag-and-drop | P1 |
| `/s/notifications` | Send Notification | Compose and send email/SMS to parents or staff | Composer, recipient selector | P1 |
| `/s/official-exams` | Official Exams | BEPC / Probatoire / BAC sessions | Session list | P2 |
| `/s/official-exams/:id` | Exam Session | Candidate list, eligibility check, export | Candidate table, export button | P2 |
| `/s/official-exams/:id/results` | Exam Results | Record and publish results | Results table | P2 |
| `/s/school-cards` | School Cards | MNU status per student, MINESEC export | Compliance table, export | P2 |
| `/s/reports` | Reports | Statistical reports: pass rates, gender breakdown, class performance | Chart pages, export | P2 |
| `/s/settings` | Settings | School profile, academic year config, assessment mode (sequences or composition) | Settings form | P0 |

### Principal / Vice-Principal

| Path | Title | Description | P |
|---|---|---|---|
| `/p/dashboard` | Dashboard | School-wide KPIs, pending validations, council schedule | P0 |
| `/p/report-cards` | Validate Report Cards | List report cards awaiting vice-principal or principal sign-off | P0 |
| `/p/class-councils` | Class Councils | All councils with status, sign off on PVs | P1 |
| `/p/performance` | Performance | Term averages, pass rates, top students per class | P1 |
| `/p/reports` | Reports | Full statistical reports for the school | P2 |

### Teacher

| Path | Title | Description | P |
|---|---|---|---|
| `/t/dashboard` | My Dashboard | My classes this year, upcoming sequences | P0 |
| `/t/grades` | My Grades | My subject assignments — select class to enter grades | P0 |
| `/t/grades/:classId/:subjectId/:termId` | Grade Sheet | Spreadsheet grid for one class/subject/term | P0 |
| `/t/comments` | Student Comments | Enter per-student appreciation text per subject/term | P0 |
| `/t/attendance` | Attendance | Record roll call per session | P1 |
| `/t/report-cards` | Report Cards | View finalized report cards for my classes | P1 |
| `/t/timetable` | My Timetable | Weekly schedule | P1 |

**Total: 40 screens** (33 admin/principal + 7 teacher)

---

## 6. Navigation Structure

### Admin / Scolarité sidebar

```
Dashboard
─────────────────
Academic
  ├── Classes
  ├── Students
  ├── Enrollments (quick enroll)
  └── Staff
─────────────────
Grades
  ├── Grade Entry
  ├── Report Cards
  └── Class Councils
─────────────────
Attendance
─────────────────
Finance
  ├── Overview
  └── Students
─────────────────
Timetable
─────────────────
Official Exams
─────────────────
Reports
─────────────────
Configuration
  ├── Settings
  ├── Tracks & Coefficients
  ├── Subjects
  ├── Terms
  └── Notifications
```

### Teacher sidebar

```
Dashboard
─────────────────
My Classes
  └── (list of assigned classes)
─────────────────
Grades
  └── (by class)
Student Comments
─────────────────
Attendance
─────────────────
Report Cards (read)
─────────────────
My Timetable
```

---

## 7. Data Model — Key Tables

All table names and column names are English. No French words in the schema.

```ts
// ============================================================
// terms  (3 per academic year)
// ============================================================
export const terms = pgTable("terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                    // "Term 1"
  code: text("code").notNull(),                    // "T1" | "T2" | "T3"
  orderIndex: integer("order_index").notNull(),    // 1, 2, 3
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status", {
    enum: ["open", "closed", "archived"],
  }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueCodeYear: unique().on(t.institutionId, t.academicYearId, t.code),
  idxYearOrder: index("terms_year_order_idx").on(t.academicYearId, t.orderIndex),
}));

// ============================================================
// tracks  (filières: A4, C, D, G2, F, TI…)
// ============================================================
export const tracks = pgTable("tracks", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),       // "Sciences, Series C"
  code: text("code").notNull(),       // "C"
  cycleLevel: text("cycle_level", {
    enum: ["first_cycle", "second_cycle", "technical"],
  }).notNull(),
  officialExamType: text("official_exam_type", {
    enum: ["BEPC", "PROBATOIRE", "BAC", "CAP", "BEP", "none"],
  }).notNull().default("BAC"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueCode: unique().on(t.institutionId, t.code),
}));

// ============================================================
// track_subject_coefficients
// ============================================================
export const trackSubjectCoefficients = pgTable("track_subject_coefficients", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  trackId: uuid("track_id")
    .notNull()
    .references(() => tracks.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  coefficient: numeric("coefficient", { precision: 4, scale: 1 }).notNull(),
  isOfficialExamSubject: boolean("is_official_exam_subject").notNull().default(false),
  officialExamCoefficient: numeric("official_exam_coefficient", { precision: 4, scale: 1 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueTrackSubject: unique().on(t.trackId, t.subjectId),
  idxTrack: index("tsc_track_idx").on(t.trackId),
}));

// ============================================================
// subjects
// ============================================================
export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),           // "Mathematics"
  nameFr: text("name_fr"),                // "Mathématiques" (for bilingual report cards)
  code: text("code").notNull(),           // "MATH"
  minesecCode: text("minesec_code"),      // official MINESEC subject code
  subjectGroup: text("subject_group"),    // "Sciences" | "Languages" | "Humanities" etc.
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueCode: unique().on(t.institutionId, t.code),
}));

// ============================================================
// students  — new table (no reuse from TKAMS Supérieur domain)
// ============================================================
// Key columns (beyond id, institutionId, createdAt, updatedAt):
//   mnu TEXT UNIQUE                      -- MINESEC national ID (cartescolaire.cm)
//   registration_number TEXT UNIQUE      -- internal school ID
//   first_name TEXT NOT NULL
//   last_name TEXT NOT NULL
//   date_of_birth DATE
//   place_of_birth TEXT
//   gender TEXT ('male'|'female')
//   nationality TEXT
//   photo_url TEXT
//   contact_name TEXT                    -- parent/guardian name (outbound notifications only)
//   contact_phone TEXT                   -- SMS target
//   contact_email TEXT                   -- email target
//   contact_relation TEXT ('father'|'mother'|'guardian')

// ============================================================
// subject_assignments  (teacher × subject × class)
// ============================================================
export const subjectAssignments = pgTable("subject_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => domainUsers.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueAssignment: unique().on(t.classId, t.subjectId, t.academicYearId),
  idxStaff: index("sa_staff_idx").on(t.staffId, t.academicYearId),
}));

// ============================================================
// assessments  (grade entries — sequences or COMP/DST/INTERRO)
// ============================================================
export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  termId: uuid("term_id")
    .notNull()
    .references(() => terms.id, { onDelete: "cascade" }),
  assessmentType: text("assessment_type", {
    enum: [
      "sequence_1", "sequence_2", "sequence_3",
      "sequence_4", "sequence_5", "sequence_6",
      "end_of_term_exam", "class_test", "quiz",
    ],
  }).notNull(),
  value: numeric("value", { precision: 5, scale: 2 }).notNull(),  // 0.00 – 20.00
  isAbsent: boolean("is_absent").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  enteredBy: uuid("entered_by").references(() => domainUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueAssessment: unique().on(t.studentId, t.classId, t.subjectId, t.termId, t.assessmentType),
  idxClassTermSubject: index("asmt_class_term_subj_idx").on(t.classId, t.termId, t.subjectId),
  idxStudent: index("asmt_student_term_idx").on(t.studentId, t.termId),
}));

// ============================================================
// term_averages  (computed — one row per student per term)
// ============================================================
export const termAverages = pgTable("term_averages", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  termId: uuid("term_id")
    .notNull()
    .references(() => terms.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  weightedAverage: numeric("weighted_average", { precision: 5, scale: 2 }),
  totalPoints: numeric("total_points", { precision: 8, scale: 2 }),
  totalCoefficients: numeric("total_coefficients", { precision: 6, scale: 1 }),
  subjectAverages: jsonb("subject_averages"),  // { [subjectId]: { avg, coeff, rank, classMax, classMin, classAvg } }
  rank: integer("rank"),
  totalStudents: integer("total_students"),
  absenceHours: integer("absence_hours").notNull().default(0),
  mentionCode: text("mention_code", {
    enum: ["below_average", "passing", "good", "very_good", "excellent", "outstanding"],
  }),
  computedAt: timestamp("computed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueStudentTerm: unique().on(t.studentId, t.classId, t.termId),
  idxClassTerm: index("ta_class_term_idx").on(t.classId, t.termId),
}));

// ============================================================
// annual_averages  (computed — one row per student per year)
// ============================================================
export const annualAverages = pgTable("annual_averages", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  t1Average: numeric("t1_average", { precision: 5, scale: 2 }),
  t2Average: numeric("t2_average", { precision: 5, scale: 2 }),
  t3Average: numeric("t3_average", { precision: 5, scale: 2 }),
  annualAverage: numeric("annual_average", { precision: 5, scale: 2 }),  // (T1+T2+T3)/3
  rank: integer("rank"),
  totalStudents: integer("total_students"),
  councilDecision: text("council_decision", {
    enum: [
      "admitted",
      "admitted_commendation",
      "admitted_distinction",
      "honour_roll",
      "conditional_pass",
      "deferred",
      "repeat_authorized",
      "repeat_mandatory",
      "expelled",
    ],
  }),
  mentionCode: text("mention_code"),
  councilDecisionId: uuid("council_decision_id").references(() => councilDecisions.id),
  computedAt: timestamp("computed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueStudentYear: unique().on(t.studentId, t.classId, t.academicYearId),
  idxClassYear: index("aa_class_year_idx").on(t.classId, t.academicYearId),
}));

// ============================================================
// student_comments  (teacher per-subject appreciations)
// ============================================================
export const studentComments = pgTable("student_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  termId: uuid("term_id")
    .notNull()
    .references(() => terms.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  text: text("text").notNull(),   // max 200 chars, enforced in application layer
  createdBy: uuid("created_by").references(() => domainUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueComment: unique().on(t.studentId, t.subjectId, t.termId, t.classId),
}));

// ============================================================
// report_cards
// ============================================================
export const reportCards = pgTable("report_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  termId: uuid("term_id")
    .notNull()
    .references(() => terms.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: [
      "draft",
      "generated",
      "validated_admin",
      "validated_vice_principal",
      "signed_principal",
      "published",
    ],
  }).notNull().default("draft"),
  pdfPath: text("pdf_path"),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  parentSignedAt: timestamp("parent_signed_at", { withTimezone: true }),  // tracks physical signed copy returned
  parentSignatoryName: text("parent_signatory_name"),
  snapshotData: jsonb("snapshot_data"),  // frozen at generation time
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueStudentTermYear: unique().on(t.studentId, t.termId, t.academicYearId),
  idxClassTerm: index("rc_class_term_idx").on(t.classId, t.termId),
  idxPublished: index("rc_published_idx").on(t.isPublishedToParent, t.institutionId),
}));

// ============================================================
// class_councils
// ============================================================
export const classCouncils = pgTable("class_councils", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  termId: uuid("term_id")
    .notNull()
    .references(() => terms.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["draft", "scheduled", "held", "signed"],
  }).notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  heldAt: timestamp("held_at", { withTimezone: true }),
  presidentId: uuid("president_id").references(() => domainUsers.id),
  secretaryId: uuid("secretary_id").references(() => domainUsers.id),
  pvPath: text("pv_path"),
  globalNote: text("global_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueClassTerm: unique().on(t.classId, t.termId),
  idxClass: index("cc_class_idx").on(t.classId, t.academicYearId),
}));

// ============================================================
// council_decisions  (one row per student per council session)
// ============================================================
export const councilDecisions = pgTable("council_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  councilId: uuid("council_id")
    .notNull()
    .references(() => classCouncils.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  decision: text("decision", {
    enum: [
      "admitted",
      "admitted_commendation",
      "admitted_distinction",
      "honour_roll",
      "conditional_pass",
      "deferred",
      "repeat_authorized",
      "repeat_mandatory",
      "expelled",
      "warning",
      "reprimand",
    ],
  }),
  comment: text("comment"),       // council's note for this student
  absenceHours: integer("absence_hours").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueStudentCouncil: unique().on(t.councilId, t.studentId),
  idxCouncil: index("cd_council_idx").on(t.councilId),
}));

// ============================================================
// fee_schedules + payments
// ============================================================
export const feeSchedules = pgTable("fee_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  tuitionAmount: numeric("tuition_amount", { precision: 12, scale: 0 }).notNull(),  // XAF
  apeAmount: numeric("ape_amount", { precision: 12, scale: 0 }).notNull(),
  instalments: jsonb("instalments"),   // [{ dueDate, amount }]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueYearInstitution: unique().on(t.institutionId, t.academicYearId),
}));

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 0 }).notNull(),
  feeType: text("fee_type", { enum: ["tuition", "ape", "other"] }).notNull(),
  paymentMethod: text("payment_method", {
    enum: ["cash", "mtn_momo", "orange_money", "bank_transfer", "campost"],
  }).notNull(),
  reference: text("reference"),
  receiptPath: text("receipt_path"),
  recordedBy: uuid("recorded_by").references(() => domainUsers.id),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxStudent: index("pay_student_year_idx").on(t.studentId, t.academicYearId),
}));

// ============================================================
// official_exam_sessions + registrations
// ============================================================
export const officialExamSessions = pgTable("official_exam_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  examType: text("exam_type", { enum: ["BEPC", "PROBATOIRE", "BAC"] }).notNull(),
  sessionYear: integer("session_year").notNull(),
  centerCode: text("center_code"),
  status: text("status", { enum: ["open", "closed", "results_published"] }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const officialExamRegistrations = pgTable("official_exam_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => officialExamSessions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  candidateNumber: text("candidate_number"),
  isEligible: boolean("is_eligible").notNull().default(false),
  eligibilityCheckedAt: timestamp("eligibility_checked_at", { withTimezone: true }),
  isAdmitted: boolean("is_admitted"),
  mention: text("mention"),
  convocationPath: text("convocation_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueSessionStudent: unique().on(t.sessionId, t.studentId),
}));

// No parent portal tokens — parents are notification contacts only, not authenticated users.
```

---

## 8. Technical Constraints

### 8.1 Single Bun App Architecture

TKAMS Secondaire ships as **one Bun process** serving both the API and the React SPA. No separate frontend/backend apps. No CORS. One Docker container.

```
apps/secondaire/
  index.ts              ← Hono entry point — API + static file server
  package.json
  bunfig.toml
  tsconfig.json
  src/
    lib/
      auth.ts           ← Better-Auth setup
      trpc.ts           ← tRPC router + procedures
      context.ts        ← request context
      db.ts             ← Drizzle client
      permissions.ts    ← createAccessControl roles
    modules/            ← 16 domain modules
    db/
      schema.ts         ← all Drizzle table definitions
    routers/
      index.ts          ← appRouter
  client/               ← React SPA (Vite project)
    index.html
    vite.config.ts
    tsconfig.json
    src/
      main.tsx          ← HashRouter entry
      pages/
        admin/
        principal/
        teacher/
      components/
      utils/
        trpc.ts         ← tRPC client (points to /trpc — same origin)
  dist/                 ← Vite build output (gitignored), served by Hono
```

**Hono server entry (`index.ts`):**
```typescript
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { trpcServer } from "@hono/trpc-server";
import { auth } from "./src/lib/auth";
import { appRouter } from "./src/routers";
import { createContext } from "./src/lib/context";

const app = new Hono();

app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));
app.use("/trpc/*", trpcServer({ router: appRouter, createContext }));
app.use("/*", serveStatic({ root: "./dist" }));
app.get("/*", serveStatic({ path: "./dist/index.html" }));  // SPA fallback

export default app;
```

**Package scripts:**
```json
{
  "scripts": {
    "dev:server": "bun --watch index.ts",
    "dev:client": "cd client && vite",
    "dev": "concurrently \"bun dev:server\" \"bun dev:client\"",
    "build:client": "cd client && vite build --outDir ../dist",
    "build": "bun run build:client && bun build ./index.ts --outdir ./out",
    "start": "bun ./out/index.js"
  }
}
```

**React router:** `HashRouter` — all client routes are `/#/admin/students`, `/#/teacher/grades`, etc. The server serves `index.html` for any non-API path; the hash portion is handled entirely by the browser.

**Dev proxy:** In development, Vite (port 5173) proxies `/trpc` and `/api/auth` to the Hono server (port 3000) so the SPA dev server and API work together without CORS. In production, everything is on one port.

### 8.2 Roles & Permissions (Better-Auth RBAC)

Uses `createAccessControl` from `better-auth/plugins/access` — one role definition per user type, enforced at the tRPC procedure level.

**`src/lib/permissions.ts`:**
```typescript
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  students:      ["create", "read", "update", "delete"],
  enrollments:   ["create", "read", "update", "delete"],
  subjects:      ["create", "read", "update", "delete"],
  assessments:   ["create", "read", "update", "delete"],
  report_cards:  ["read", "publish", "print"],
  class_councils:["create", "read", "update"],
  attendance:    ["create", "read", "update"],
  finance:       ["create", "read", "update", "delete"],
  timetable:     ["create", "read", "update", "delete"],
  staff:         ["create", "read", "update", "delete"],
  settings:      ["read", "update"],
  notifications: ["create", "read"],
  official_exams:["create", "read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const teacher = ac.newRole({
  students:     ["read"],
  assessments:  ["create", "read", "update"],
  report_cards: ["read"],
  attendance:   ["create", "read", "update"],
  timetable:    ["read"],
  notifications:["read"],
});

export const principal = ac.newRole({
  students:      ["read"],
  enrollments:   ["read"],
  assessments:   ["read"],
  report_cards:  ["read", "publish", "print"],
  class_councils:["read", "update"],
  attendance:    ["read"],
  timetable:     ["read"],
  staff:         ["read"],
  finance:       ["read"],
  settings:      ["read"],
  notifications: ["create", "read"],
  official_exams:["read"],
});

export const admin = ac.newRole({
  students:      ["create", "read", "update", "delete"],
  enrollments:   ["create", "read", "update", "delete"],
  subjects:      ["create", "read", "update", "delete"],
  assessments:   ["create", "read", "update", "delete"],
  report_cards:  ["read", "publish", "print"],
  class_councils:["create", "read", "update"],
  attendance:    ["create", "read", "update"],
  finance:       ["create", "read", "update", "delete"],
  timetable:     ["create", "read", "update", "delete"],
  staff:         ["create", "read", "update", "delete"],
  settings:      ["read", "update"],
  notifications: ["create", "read"],
  official_exams:["create", "read", "update"],
});
```

**`src/lib/auth.ts`:**
```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { ac, admin, principal, teacher } from "./permissions";

export const auth = betterAuth({
  plugins: [
    organization({
      ac,
      roles: { admin, principal, teacher },
    }),
  ],
});
```

**tRPC procedure guard example:**
```typescript
// src/lib/trpc.ts
export const teacherProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const ok = await auth.api.hasPermission({
    headers: ctx.headers,
    body: { permission: { assessments: ["create"] } },
  });
  if (!ok.success) throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const ok = await auth.api.hasPermission({
    headers: ctx.headers,
    body: { permission: { settings: ["update"] } },
  });
  if (!ok.success) throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});
```

### 8.3 What is completely independent from TKAMS Supérieur

Every domain table in section 7 is new. No join between `term_averages` and any LMD table. No shared module code between `assessments` (secondary) and `grades` (supérieur).

Both systems live in the same monorepo and share the same PostgreSQL database via separate app instances with separate Better-Auth organization tenants. Institution metadata includes a `type` enum: `higher_ed | secondary`.

### 8.4 Assessment mode configuration

The `assessment_mode` is configured at the institution level (could also be per class):
- `six_sequence`: two sequences per term, subject average = (S1 + S2) / 2
- `composition`: one end-of-term exam + one or two class tests + optional quiz

The `assessmentType` enum supports both modes. The average computation service reads the mode from institution settings.

### 8.5 Report card computation

Triggered automatically after every `assessments.upsert` call:
1. Recompute `term_averages` for the affected student × class × term
2. Recompute rankings for all students in the class × term
3. Invalidate the corresponding `report_cards` row (set status back to `draft` if already generated)

No batch job. Computation is synchronous and fast (<50ms for a class of 60 students) because it is a simple weighted average over ≤15 subjects.

### 8.6 No batch jobs

The system does not use the batch-jobs framework from TKAMS Supérieur. All operations that needed batch jobs in TKAMS Supérieur (credit recomputation, grade imports) are either:
- Synchronous and fast enough to be inline (average recomputation)
- CSV upload endpoints that process the file immediately and return results

Class promotion (end-of-year) is a single `enrollments.bulkPromote` tRPC call that runs synchronously — it processes at most 500–2000 students per school, which takes under a second.

### 8.7 Bilingualism

All UI text is in i18next (FR/EN). Report cards can be generated in either language per student — the language is a field on the enrollment or student record. Subject names store both `name` (English default) and `nameFr`.

---

## 9. MVP Roadmap

### P0 — Core (Day 1 usable)

Minimum for a school to run its full trimester cycle:

- [ ] Auth + organization setup (reuse Better-Auth)
- [ ] Institution settings (school profile, MINESEC code, assessment mode)
- [ ] Academic years, terms
- [ ] Tracks with coefficient grids (import MINESEC defaults)
- [ ] Classes and levels
- [ ] Subjects catalogue
- [ ] Students: create, enroll in class, search
- [ ] Staff and subject assignments (teacher → subject → class)
- [ ] Grade entry by teacher (sequence or composition mode)
- [ ] Automatic average + rank computation
- [ ] Report card generation (admin triggers per class/term)
- [ ] PDF report card export (MINESEC layout)
- [ ] Report card validation workflow (admin → VP → principal)
- [ ] Basic fee tracking (manual payment recording)
- [ ] Admin dashboard with KPIs
- [ ] Teacher dashboard (my classes, grade entry)

### P1 — Version 1 (fully operational school)

- [ ] Class council module (sessions, per-student decisions, PV export)
- [ ] Attendance roll call (teacher) + absence totals on report card
- [ ] Weekly timetable (per class, per teacher)
- [ ] Annual average + year-end council decisions
- [ ] Student-level fee dashboard + receipt generation
- [ ] Mobile Money payment logging (manual — no API integration in P1)
- [ ] SMS/email notifications to parent contacts (via third-party gateway)

### P2 — Version 2 (compliance + advanced)

- [ ] Official exam management (BEPC/BAC candidate lists, convocations, results)
- [ ] MNU field + cartescolaire.cm export
- [ ] MINESEC statistical reports (enrollment by gender/track, pass rates)
- [ ] Mobile Money API integration (MTN MoMo, Orange Money)
- [ ] Discipline register (conduct record, sanctions)
- [ ] School card photo printing (MNU card with photo)
- [ ] Offline / LAN-sync mode
- [ ] GCE A-Level / O-Level sub-system (anglophone schools)
- [ ] Multi-campus support
