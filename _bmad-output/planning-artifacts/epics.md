---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - path: _bmad-output/planning-artifacts/prd.md
    description: Retake exams PRD
  - path: _bmad-output/planning-artifacts/architecture.md
    description: Retake architecture decisions
---

# TKAMS (Tefoye and Kana Academic Management System) - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for TKAMS (Tefoye and Kana Academic Management System), decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Registrar can generate a retake eligibility list for a class course in one action, scoped to the latest exam session.  
FR2: Registrar can view each student’s eligibility reason (failed exam, UE deficit, jury override, manual flag) directly in the list.  
FR3: Registrar can add, edit, or remove eligibility entries (e.g., medical override) before finalizing the retake session roster.  
FR4: Registrar can export the eligibility roster with reasons for offline review or jury presentation.  
FR5: Registrar can create a retake exam that is explicitly linked to the base exam, inheriting course metadata automatically.  
FR6: Registrar can schedule the retake session (date, time, room, invigilators) using the same interface as normal exams.  
FR7: Registrar can track attendance for the retake session and store justifications for absences.  
FR8: Registrar can view the lifecycle status of each retake session (scheduled, grading, validated, locked).  
FR9: Teacher can access a retake exam from the existing `/teacher/grades` interface with clear labeling of the session type.  
FR10: Teacher can view both the original attempt score and the retake placeholder per student while entering grades.  
FR11: Teacher can import/export grades for the retake using the current CSV workflow without extra steps.  
FR12: Teacher can validate and lock retake grades following the existing approval pipeline, with contextual messaging about the configured scoring policy.  
FR13: Platform automatically recomputes student credit ledgers and promotion facts when a retake grade is validated.  
FR14: Promotion officer can view a dashboard summarizing each retake session’s eligibility counts, attendance, pass rates, and promotion deltas.  
FR15: Promotion officer can drill into a student record to see the timeline of attempts, the policy decision (replace vs best-of), and resulting ledger entries.  
FR16: Registrar or promotion officer can export an audit report that ties eligibility decisions, attendance, grades, and promotion outcomes together.  
FR17: Admin can define per-program or per-course retake policies (e.g., scoring mode, max attempts) surfaced to registrars/teachers.  
FR18: System enforces one retake session per course per academic year unless the policy explicitly allows overrides.  
FR19: Role-based access controls ensure only registrars can schedule sessions, teachers can grade, and promotion officers can view audit dashboards.  
FR20: Feature flags or rollout controls allow the retake capability to be enabled per institution/class course.

### NonFunctional Requirements

NFR1: Eligibility generation and retake dashboards must match existing exam/promotion latency budgets (normal admin UX responsiveness).  
NFR2: Promotion recalculations triggered by retake validation must finish within ~1 minute and emit correlation IDs for troubleshooting.  
NFR3: All retake actions inherit current RBAC rules and emit audit events (eligibility overrides, session actions, ledger changes).  
NFR4: Retake UI must maintain the existing WCAG accessibility level (keyboard navigation, focus, color contrast).  
NFR5: Monitoring/alerting must cover eligibility generation, ledger recalcs, and retake validation with kill switches for rollback.  
NFR6: Feature flags must allow enabling/disabling retake creation and grading per institution/class without impacting normal exams.

### Additional Requirements

- Brownfield extension only: extend current Bun/Hono/tRPC backend and React SPA surfaces; no new services or frameworks.  
- Schema updates are additive (session_type + parent_exam_id on exams, new student_exam_attempts, lightweight retake_policies) and must include institution_id for multi-tenant safety.  
- Retake module boundaries follow architecture: eligibility service, session manager, grading context upgrades, promotion hooks, policy management.  
- Use feature flags to guard new TRPC endpoints and UI panels so rollout can be staged per institution/class.  
- MVP scope explicitly excludes batch jobs, analytics dashboards, student self-service, and payment flows.  
- Promotion recalculation must reuse existing ledger services and rule engine, not fork logic.  
- UI flows derive directly from PRD journeys; reuse admin/teacher layouts and shared components.  
- All queries and migrations must respect institution/organization alignment (filter by institution_id, no cross-tenant leakage).

### FR Coverage Map

FR1: Epic 1 - Registrar retake eligibility and overrides  
FR2: Epic 1 - Registrar retake eligibility and overrides  
FR3: Epic 1 - Registrar retake eligibility and overrides  
FR4: Epic 1 - Registrar retake eligibility and overrides  
FR5: Epic 2 - Retake session scheduling & linkage  
FR6: Epic 2 - Retake session scheduling & linkage  
FR7: Epic 2 - Retake session scheduling & linkage  
FR8: Epic 2 - Retake session lifecycle visibility  
FR9: Epic 3 - Teacher retake grading experience  
FR10: Epic 3 - Teacher retake grading experience  
FR11: Epic 3 - Teacher retake grading experience  
FR12: Epic 3 - Teacher retake grading experience  
FR13: Epic 4 - Promotion recalculation & impact  
FR14: Epic 4 - Promotion recalculation & impact  
FR15: Epic 4 - Promotion recalculation & impact  
FR16: Epic 4 - Promotion recalculation & impact  
FR17: Epic 1 - Retake policy configuration  
FR18: Epic 1 - Attempt limits / enforcement  
FR19: Epic 1 - RBAC alignment  
FR20: Epic 1 - Feature-flagged rollout controls

## Epic List

### Epic 1: Registrar Retake Eligibility & Policy Controls
Enable registrars/admins to derive, review, adjust, and roll out retake eligibility aligned with institution policies while protecting existing workflows.  
**FRs covered:** FR1, FR2, FR3, FR4, FR17, FR18, FR19, FR20

### Epic 2: Retake Session Scheduling & Management
Allow registrars to spin up linked retake exam sessions, schedule logistics, and monitor attendance/lifecycle without leaving current admin flows.  
**FRs covered:** FR5, FR6, FR7, FR8

### Epic 3: Teacher Retake Grading Experience
Provide teachers (and delegated editors) with a retake-aware grade entry workflow that preserves both attempts and reuses existing tooling.  
**FRs covered:** FR9, FR10, FR11, FR12

### Epic 4: Promotion Impact & Audit Visibility
Surface retake outcomes to promotion officers and audit stakeholders with automatic ledger recalculation, dashboards, and exportable records.  
**FRs covered:** FR13, FR14, FR15, FR16

## Epic 1: Registrar Retake Eligibility & Policy Controls

### Story 1.1: Generate Retake Eligibility Roster
As a registrar,  
I want to automatically generate a retake eligibility list scoped to a class course’s latest exam,  
So that I can immediately see who qualifies without manual spreadsheets.

**Acceptance Criteria:**

**Given** a registrar with the retakes feature enabled and a class course with completed exams  
**When** they open the retake eligibility panel and request generation  
**Then** the system produces a list of students with eligibility reasons (failed exam, UE deficit, jury override flag) derived from existing data  
**And** results respect `institution_id` filtering and display in descending priority order.

### Story 1.2: Manage Overrides and Export Eligibility
As a registrar,  
I want to adjust eligibility entries and export the roster,  
So that I can honor jury/medical decisions and share records.

**Acceptance Criteria:**

**Given** an eligibility roster is displayed  
**When** the registrar edits a row (approve/deny, add override notes)  
**Then** the change is saved with audit metadata and reflected immediately  
**And** selecting “Export” downloads a CSV/PDF including reasons, overrides, and timestamps.

### Story 1.3: Configure Retake Policies
As an administrator,  
I want to define per-program retake policies (max attempts, scoring strategy),  
So that eligibility and grading obey institutional rules.

**Acceptance Criteria:**

**Given** admin permissions  
**When** they open the retake policy settings  
**Then** they can set `maxAttemptsPerCoursePerYear` (default 2) and `scoringStrategy` (“replace” or “best_of”) per program or institution-wide  
**And** values persist in the `retake_policies` store and surface to eligibility/grading services.

### Story 1.4: Gate Retake Features via RBAC & Feature Flags
As a platform operator,  
I want retake functionality hidden unless enabled for an institution and user role,  
So that rollout is safe and respects permissions.

**Acceptance Criteria:**

**Given** a feature flag entry per institution/class course  
**When** the flag is disabled  
**Then** related TRPC procedures reject requests and UI routes hide retake options even if users deep-link  
**And** enabling the flag immediately exposes functionality to authorized registrars/teachers without redeploying.

## Epic 2: Retake Session Scheduling & Management

### Story 2.1: Create Linked Retake Exam Session
As a registrar,  
I want to create a retake exam linked to the base exam,  
So that scheduling inherits the right metadata and downstream processes know the relationship.

**Acceptance Criteria:**

**Given** an approved base exam  
**When** the registrar chooses “Create Retake Session”  
**Then** the system clones course metadata, stores `session_type = "retake"`, and sets `parent_exam_id` to the base exam  
**And** a default set of `student_exam_attempts` records is seeded for eligible students.

### Story 2.2: Schedule Retake Logistics
As a registrar,  
I want to edit retake exam details (date, time, room, invigilators),  
So that the session mirrors current scheduling capabilities.

**Acceptance Criteria:**

**Given** a retake exam exists  
**When** the registrar updates scheduling fields  
**Then** changes persist with validation (no overlaps, required fields) and notifications leverage existing patterns  
**And** audit logs capture who modified details and when.

### Story 2.3: Track Retake Attendance & Status
As a registrar,  
I want to track attendance and lifecycle status for each retake session,  
So that I know who attended and whether the session is grading, validated, or locked.

**Acceptance Criteria:**

**Given** a retake exam with associated attempts  
**When** attendance is recorded (present, absent with justification)  
**Then** `student_exam_attempts.status` updates accordingly  
**And** session-level status badges update (scheduled → grading → validated/locked) with visible timelines.

## Epic 3: Teacher Retake Grading Experience

### Story 3.1: Display Retake Context in Grade Entry
As a teacher,  
I want the grade entry screen to clearly show I am grading a retake and see both attempts,  
So that I avoid overwriting original scores.

**Acceptance Criteria:**

**Given** a teacher opens `/teacher/grades` for a retake exam  
**When** the page loads  
**Then** the UI shows a retake badge, original attempt score, and an editable retake score field per student  
**And** switching between exams preserves context without page reloads.

### Story 3.2: Import/Export Retake Grades with Attempt Binding
As a teacher,  
I want to import/export retake grades via CSV while keeping attempts separate,  
So that I can reuse existing workflows without confusion.

**Acceptance Criteria:**

**Given** a retake exam with student attempts  
**When** the teacher downloads the CSV  
**Then** the file includes columns for original score (read-only) and retake score (editable) plus attempt identifiers  
**And** uploading updates only the retake attempt scores, validating formats and rejecting inconsistent rows with actionable errors.

### Story 3.3: Validate & Lock Retake Grades with Policy Messaging
As a teacher,  
I want to validate and lock retake grades with feedback on how policies (replace/best-of) will be applied,  
So that I understand the impact before finalizing.

**Acceptance Criteria:**

**Given** retake grades are entered  
**When** the teacher clicks “Validate/Lock”  
**Then** the system summarizes which scores will replace originals vs keep best-of, warns about missing entries, and requires confirmation  
**And** upon locking, grades become read-only, audit logs capture the action, and promotion recalculation is triggered.

## Epic 4: Promotion Impact & Audit Visibility

### Story 4.1: Trigger Promotion Recalculation on Retake Validation
As the system,  
I want to automatically recompute ledgers and promotion facts when a retake is validated,  
So that academic decisions stay accurate.

**Acceptance Criteria:**

**Given** a retake exam transitions to locked  
**When** the post-validation hook runs  
**Then** ledger and promotion facts recompute for affected students, respecting scoring strategy, and finish within ~1 minute  
**And** failures log correlation IDs and surface alerts.

### Story 4.2: Retake Impact Dashboard for Promotion Officers
As a promotion officer,  
I want a dashboard summarizing retake eligibility counts, attendance, pass rates, and promotion changes,  
So that I can monitor rattrapage effectiveness.

**Acceptance Criteria:**

**Given** promotion officer access  
**When** they open the retake dashboard  
**Then** widgets display total eligible, overrides, attendees, pass/fail counts, and number of students promoted due to retakes  
**And** filters (class, program, academic year) work with existing pagination performance budgets.

### Story 4.3: Student Attempt Timeline & Audit Export
As a promotion officer,  
I want to drill into a student and export a report showing original vs retake attempts, policy result, and ledger impact,  
So that audit committees trust the decision trail.

**Acceptance Criteria:**

**Given** the officer selects a student  
**When** they view the details  
**Then** a timeline shows exam attempts with statuses, scores, scoring strategy outcome, and ledger deltas  
**And** clicking “Export” downloads a PDF/CSV capturing eligibility reason, attendance, grades, validation time, and promotion change with audit metadata.
