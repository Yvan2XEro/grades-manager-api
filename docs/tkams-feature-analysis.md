# TKAMS Feature Analysis
## Gaps, Weaknesses, and Competitive Strengths vs. Frappe Education

*Date: June 2026 — Based on repository-level TKAMS feature review and Frappe Education feature survey*

---

## Overview

This document compares TKAMS (an academic management system for African higher-education institutions following the LMD system) against Frappe Education (an open-source ERP-based academic management system). The goal is to identify:

1. Features present in Frappe Education that are missing from TKAMS entirely
2. Features that exist in TKAMS but are poorly or incompletely implemented
3. Areas where TKAMS is already stronger than Frappe Education

TKAMS has no student fee management. The billing system in the TKAMS website (Payload CMS) is exclusively for SaaS subscription acquisition and is out of scope for this comparison.

The comparison should not be read as a recommendation to copy Frappe Education feature-for-feature. TKAMS is strongest when it stays focused on the higher-education academic lifecycle: admissions, enrollment, tuition clearance, exams, grades, deliberations, promotions, and academic documents. Features borrowed from Frappe should be adapted to this lifecycle instead of turning TKAMS into a generic school ERP.

---

## Part 1 — Features Missing from TKAMS (Present in Frappe Education)

### 1.1 Attendance Tracking

**What Frappe Education has:**
- Per-session attendance marking for each student (Present / Absent / Late) tied to a specific course session
- Bulk attendance tool: instructor marks the entire class in one view, then adjusts exceptions
- Attendance reports per student, per course, and per period (monthly, semester-wide)
- Configurable eligibility threshold: students below a minimum attendance rate (e.g., < 75%) are automatically flagged as ineligible to sit an exam
- Link between attendance status and exam eligibility enforcement

**What TKAMS has:**
TKAMS has "attendance alerts" — a teacher can send a free-text severity alert for a course section. This is a communication tool, not a data collection tool. There are no per-student, per-session attendance records, no rate calculation, no eligibility enforcement based on attendance.

**Impact:** Institutions cannot track absenteeism, cannot generate attendance reports for academic councils, and cannot enforce attendance-based eligibility rules.

---

### 1.2 Admission Workflow

**What Frappe Education has:**
- Self-service online admission form (applicant-facing)
- Application review pipeline: Application → Review → Accept / Reject → Enroll
- Automatic student record creation and registration number generation on acceptance
- Document checklist per application (required uploads: baccalauréat, ID, photo…)

**What TKAMS has:**
An admin or super_admin creates student records directly. There is no applicant-facing portal, no application form, no review pipeline. Admission is an internal data-entry operation.

**Impact:** Institutions using TKAMS cannot offer a digital admissions process to candidates. All intake must be done manually by administrative staff.

---

### 1.3 Course Timetable / Schedule

**What Frappe Education has:**
- Weekly course timetable generation with room and instructor assignment per session
- Conflict detection (same instructor or same room double-booked at the same time slot)
- Student-facing and instructor-facing timetable views
- Calendar-style interface showing scheduled sessions

**What TKAMS has:**
TKAMS has an exam scheduler (bulk-creates exam sessions across classes and programs) but has no concept of recurring weekly course sessions. There is no timetable, no room/venue assignment for courses, and no weekly schedule view for students or teachers.

**Impact:** Students and teachers have no visibility into their weekly course schedule through TKAMS. This is typically one of the first things every user of an academic system expects to see.

---

### 1.4 Student Fee Management

**What Frappe Education has:**
- Fee structures with configurable components (tuition, registration, library fee…) per program and academic year
- Fee schedules (monthly, quarterly, semester, annual) with installment due dates
- Per-student fee discounts and exemptions
- Fee status tracking: paid / partially paid / overdue
- Academic gatekeeping: students with outstanding fees can be blocked from exam registration, transcript generation, or diploma issuance
- Payment receipts and full payment history per student

**What TKAMS has:**
Nothing. TKAMS has no student-facing financial module of any kind. There is no fee structure, no payment tracking, no student ledger, no gating mechanism based on financial status.

**Impact:** Institutions must manage student payments entirely in an external system with no connection to academic data. A student with unpaid fees can still register for exams, download their diploma, and receive a transcript through TKAMS.

**TKAMS-specific interpretation:**
This should not become a full accounting module in the first version. The core institutional need is tuition clearance: fee structures, payment orders or quitus, third-party bank payment confirmation, receipts, student financial status, and academic gates based on clearance.

---

### 1.5 Guardian / Parent Management

**What Frappe Education has:**
- Guardian records linked to student profiles (one or more guardians per student)
- Guardian relationship type (father, mother, legal guardian…)
- Guardian portal: parents can log in and view their child's grades and attendance
- Automated reports sent to guardians (grade reports, attendance alerts)

**What TKAMS has:**
No concept of guardians or parents. The student profile has personal information only. There is no parent portal and no mechanism to communicate with families.

**Impact:** This is a significant gap for secondary-level institutions or any program where family communication is expected. Even at university level, some institutions send formal grade reports to legal guardians.

---

### 1.6 Configurable Grading Scales

**What Frappe Education has:**
- Grading scale definitions: map score ranges to letter grades or mentions (A, B, C, D, F; or Excellent, Very Good, Good, Pass, Fail)
- Multiple scales can coexist for different programs or courses
- GPA computation based on the configured scale
- Automatic mention assignment based on the score range

**What TKAMS has:**
Numeric averages are computed correctly (with coefficient weighting for UE/EC structure). However, the mention labels (Passable, Assez Bien, Bien, Très Bien) are hardcoded in the backend with fixed thresholds (10, 12, 14, 16/20). There is no configurable scale per program or per institution.

**Impact:** Institutions that use a different grading convention (e.g., a 4.0 GPA scale, or a custom mention system) cannot adapt TKAMS to their local standard without a code change.

---

### 1.7 Student Leave Request Management

**What Frappe Education has:**
- Student leave application form (absence justification with dates and reason)
- Instructor or admin approves or rejects the leave
- Approved leaves are factored into attendance calculations (excused absence)

**What TKAMS has:**
No leave management. If a student misses a session and the institution tracks attendance (even informally), there is no mechanism to record or approve a justified absence.

---

### 1.8 Course Content and Learning Management (LMS)

**What Frappe Education has:**
- Course content organized into chapters and lessons (text, video, PDF)
- Online quizzes attached to lessons
- Student progress tracking per course
- Certificate issuance on course completion
- Discussion forum per course

**What TKAMS has:**
TKAMS is a grades and academic records system, not a learning platform. It has no content delivery, no quizzes, no progress tracking, and no LMS features. This is by design — TKAMS focuses on the administrative side (enrollment, grading, deliberations) rather than content delivery.

**Observation:** This gap is intentional and filling it would require a significant scope expansion. For most institutions, integrating TKAMS with a dedicated LMS (Moodle, Canvas, Google Classroom) is likely the right approach rather than building LMS features natively.

---

## Part 2 — Features Existing in TKAMS but Incompletely Implemented

### 2.1 Student Portal — Too Thin

**Current state:**
The student portal (`/student/`) shows:
- Personal grades and transcript (current year)
- Upcoming exams calendar
- Course self-enrollment (when an enrollment window is open)
- Deliberation decisions and promotion status

**What is missing compared to expectations:**
- No attendance status (since attendance is not tracked — see §1.1)
- No weekly timetable (since timetable does not exist — see §1.3)
- No self-service document download (attestation, official transcript) — students must ask an admin to generate and send documents
- No financial status (no fee module — see §1.4)
- No communication center: students cannot see notifications or messages in-app

**Impact:** Students use the portal mainly to check grades. Everything else requires going through an administrator.

---

### 2.2 In-App Notification System — Channel Exists, UI Does Not

**Current state:**
The `notifications` schema supports two channels: `email` and `in-app`. Backend procedures exist to queue, list, and acknowledge notifications. Email delivery works via Resend.

**What is missing:**
No frontend UI renders in-app notifications. The student portal, teacher hub, and admin panel have no notification bell, no notification list, and no in-app alert center. The `in-app` channel in the schema is effectively dead — nothing reads it in the frontend.

Additionally, the notification system has no failure state: delivery failures are console-logged and the notification stays in `pending` status forever with no retry mechanism.

**Impact:** Users never see in-app notifications. The system cannot surface time-sensitive alerts (exam result published, enrollment window opened, deliberation result available) inside the application.

---

### 2.3 Configurable Mention / Grade Scale — Hardcoded Thresholds

Already noted in §1.6 from the Frappe comparison angle. To rephrase for TKAMS specifically:

The mention logic (`Passable`, `Assez Bien`, `Bien`, `Très Bien`) and the pass threshold (10/20) appear in multiple places in the backend (deliberation rules, transcript generation, grade summaries). These values are institutional conventions that vary between countries and even between programs within the same institution.

There is no `gradeScale` or `institutionSettings` record that an admin can update to change these thresholds. Changing them requires a code modification and a redeployment.

---

### 2.4 Workflow Approval — No Granular Status History

**Current state:**
Exams can be submitted for approval, then approved or rejected by a dean. The state (`pending`, `approved`, `rejected`) is stored on the exam record.

**What is missing:**
- No full audit trail of who did what and when on a given exam's approval workflow (beyond the final state)
- No in-app notification to the teacher when their submitted exam is approved or rejected
- No comment/reason field visible on the teacher side when a rejection happens (the rejection reason exists in the workflow record but is not surfaced in the teacher portal)

---

### 2.5 Batch Job Monitoring — No Live Progress in UI

**Current state:**
The admin batch jobs dashboard shows job status (pending, running, completed, failed) and step counts. Jobs can be created, cancelled, and rolled back.

**What is missing:**
- No real-time progress update while a job is running (the UI does not poll or stream step-level progress)
- No step-level log viewer in the frontend (logs exist in the `batch_job_logs` table but are not surfaced in the UI)
- No email/notification when a long-running job completes or fails

---

### 2.6 Deliberation Decision Visibility for Students

**Current state:**
The student portal has a "My Decisions" section that shows deliberation outcomes. However, deliberation results are only visible to students after the deliberation is in `finalized` state.

**What is missing:**
- No formal "publication" event: there is no admin action to "publish results to students" and no timestamp of when results were released
- No notification sent to students when their deliberation result becomes available
- Students who check the portal before finalization see nothing, with no indication of when results will be available

---

## Part 3 — Where TKAMS Is Stronger Than Frappe Education

This section documents genuine TKAMS advantages to avoid scope creep. These areas are strategically important, but some still need UX hardening and operational polish.

| Feature Area | TKAMS Advantage |
|---|---|
| **LMD Credit System** | Full UE/EC structure with coefficient-weighted averages, per-student credit ledger tracking accumulation across years. Frappe Education has a simple credit field per course with no ponderation system. |
| **Deliberation Engine** | Full jury simulation: configurable rules (json-rules-engine), automated outcome computation, per-student manual override with justification, computation audit logs, promotion of admitted students. Frappe has basic pass/fail per student with no rules engine. TKAMS should keep improving the UX because this workflow is mission-critical. |
| **Grade Approval Workflow** | Dean validates grade sets before publication; teacher submits exam grades for review; rejection sends the grade set back for correction. Frappe has no equivalent peer-review workflow for grades. |
| **Document Template System** | HTML-based templates with theme system, standard vs. center variants, per-class and per-program overrides, in-browser editor, system seed for 16 default templates. Frappe generates fixed-format PDF reports with no customization. |
| **Multi-Tenancy** | One TKAMS deployment serves multiple institutions, each fully isolated by `institutionId`. Frappe Education is single-institution per site. |
| **Diplomation External API** | Secured REST API (HMAC-SHA256 API keys, webhook delivery) for external diploma printing partners. Frappe has no equivalent integration surface. |
| **Promotion Rules Engine** | Named, configurable promotion rules with dry-run evaluation (`evaluateClass`) and full execution audit. Separate from deliberation rules. |
| **Batch Jobs with Rollback** | Background jobs with preview, step-level progress, cancel, and rollback support. Frappe relies on background workers with no built-in rollback mechanism at the application layer. |
| **Academic Year Transitions** | Full state-machine workflow (draft → submitted → approved → executed) for year-end student transitions, with per-student manual resolution. |
| **Exam Locking** | Irreversible lock on approved exams (automatic or manual) with background enforcement — prevents grade tampering after official approval. |

---

## Part 4 — Priority Recommendations

Ranked by strategic product value for TKAMS, not by similarity to Frappe Education. The first priorities are the workflows most likely to become daily institutional blockers.

### Priority 1 — Student Fee Clearance / Quitus (Very high impact, High effort)
Build a focused financial clearance module, not a full accounting ERP. The first version should support fee structures by academic year, program/class, semester, and student category; payment installments; payment orders or quitus; bank/reference validation; receipts; and a student financial status.

The most important business value is academic gatekeeping: institutions should be able to block transcript generation, diploma issuance, re-enrollment, exam registration, or other sensitive actions when the student is not financially cleared.

Recommended v1 scope:
- Fee structure and fee components
- Installments by semester, annual period, or custom due dates
- Student payment order/quitus generation
- Manual or imported bank confirmation
- Receipt generation
- Clearance status exposed in admin and student dashboards
- Configurable academic gates

### Priority 2 — Student Self-Service Portal (High impact, Medium effort)
The portal should become the student's operational cockpit, not just a grade viewer. It should answer the student's daily questions: am I enrolled, what do I owe, can I generate my quitus, are my grades published, what is my deliberation decision, which documents can I download, and what actions are pending?

Recommended v1 scope:
- Financial status and quitus history
- Self-service attestation and current transcript download
- Published grades and deliberation decisions
- Current enrollment and academic year status
- Notifications and pending actions

### Priority 3 — Deliberation and Academic Transition UX Hardening (High impact, Medium effort)
TKAMS is already strong here, but the workflow must be impossible to misunderstand. The system should guide administrators through annual deliberation, signing, transition planning, approval, execution, and post-execution review with clear statuses, contextual actions, and no hidden refresh requirements.

Recommended v1 scope:
- Clear state machine visible in the UI
- One primary action per state
- Per-class and per-student readiness diagnostics
- Automatic UI refresh after every workflow action
- Dedicated transition detail page for large plans
- Audit trail visible to administrators

### Priority 4 — In-App Notification UI (Medium impact, Low effort)
The backend channel already exists. Adding a notification bell component in the shared layout that reads the `in-app` queue would complete an underused feature with limited backend work.

Recommended events:
- Grade set approved or rejected
- Results published
- Enrollment window opened
- Transition plan approved/executed
- Student document generated
- Payment/quitus confirmed
- Long-running batch job completed or failed

### Priority 5 — Configurable Grade Scale (Medium impact, Low effort)
Extract the hardcoded thresholds (10, 12, 14, 16) into an institution-level or program-level grade scale that admins can configure. Apply this scale everywhere mentions are computed: deliberations, transcripts, dashboards, publications, and exports.

### Priority 6 — Course Timetable (Medium impact, Medium effort)
Every student and teacher expects schedule visibility, but for TKAMS this should follow the core academic and clearance workflows. A basic implementation would still create immediate value: sessions with day, start time, end time, room, instructor, linked class course, and student/teacher calendar views.

Recommended v1 scope:
- Course sessions attached to class courses
- Room and instructor assignment
- Student and teacher timetable views
- Basic conflict detection for room and instructor overlap

### Priority 7 — Attendance Tracking (Medium impact, High effort)
Structured attendance is useful, especially where exam eligibility depends on attendance. However, it should be introduced after schedules exist, because attendance without scheduled course sessions becomes less reliable and harder to audit.

Recommended v1 scope:
- Attendance per course session and student
- Bulk mark present, then adjust exceptions
- Excused absence status
- Attendance rate by student and class course
- Optional eligibility gate based on configured threshold

### Priority 8 — Admission Workflow (Medium impact, High effort)
An applicant portal with an application -> review -> admit pipeline would modernize intake. It should be planned as a standalone feature after the core academic and financial lifecycle is stable.

Recommended v1 scope:
- Applicant record and public application form
- Document checklist
- Review status and decision
- Conversion to student profile
- Initial enrollment and registration number generation

### Deferred — Native LMS Features
TKAMS should not build a full LMS in the near term. Course content, quizzes, discussions, and online learning progress should be handled through integration with dedicated LMS tools such as Moodle or Canvas unless the product strategy changes.

---

*End of document.*
