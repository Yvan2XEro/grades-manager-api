# Domain User Profile Page — Design Spec

**Status:** Draft — awaiting validation before Linear tickets are created  
**Author:** Claude Code  
**Date:** 2026-07-10

---

## Overview

Currently there is no dedicated per-person profile page in the admin portal. User records are visible only through table rows (students list, users list) with creation-only dialogs. This spec defines a rich, role-aware profile page for every domain user, accessible from anywhere in the app where a person's name appears.

---

## Route Structure

Base path: `/admin/profiles/:profileId`

The hub follows the fee-clearance URL-path tab pattern (not search params):

```
/admin/profiles/:profileId                    → redirect to first available tab
/admin/profiles/:profileId/identity           → Personal info (all roles)
/admin/profiles/:profileId/account            → Auth account & permissions (all roles)
/admin/profiles/:profileId/enrollment         → Current class + enrollment history (students)
/admin/profiles/:profileId/results            → Grades, averages, credits, deliberations (students)
/admin/profiles/:profileId/finances           → Fee clearance status & payment history (students)
/admin/profiles/:profileId/guardians          → Linked guardians / tutors (students)
/admin/profiles/:profileId/documents          → Generated certificates, transcripts (students)
/admin/profiles/:profileId/courses            → Assigned courses & grade submission status (teachers, grade editors)
/admin/profiles/:profileId/attendance         → Attendance alerts & rates per course (teachers)
/admin/profiles/:profileId/workflows          → Pending & completed workflow actions (teachers, deans)
```

---

## Entry Points

The profile page should be reachable from:

- `/admin/students` — clicking a student row opens their profile
- `/admin/users` — clicking a user row opens their profile
- `/admin/admissions` — accepted applicant record links to the converted student's profile
- `/admin/guardians` — each guardian's row links to their profile; the profile also lists their linked students
- `/admin/grades/:courseId` — teacher name in the course header links to the teacher's profile (admin only)
- Notification recipient names (where applicable)
- Any `<DomainUserAvatar>` or name chip across the app

---

## Page Header (all roles)

Displayed above the tab nav on every tab:

| Element | Source |
|---|---|
| Avatar (circle, 64 px) | `domainUsers.avatarUrl` or initials fallback |
| Full name | `firstName + lastName` |
| Role badge(s) | `member.role` — translated label + color per role |
| Status badge | `domainUsers.status` — Active / Inactive |
| Primary email | `domainUsers.primaryEmail` |
| Quick actions (admin only) | Edit profile, Deactivate account, Send email |

---

## Tab: Identity (all roles)

Mirrors the **Profile** tab from `/settings` but in read-mode for admins (edit mode for own profile):

- First name, Last name
- Email (read-only) + Phone
- Date of birth + Place of birth
- Gender + Nationality
- Institution membership: linked organization, member since date

---

## Tab: Account (all roles)

Auth-level information, admin-only view:

- Better-Auth user ID (display-only)
- Email verification status (verified / unverified + date)
- Active sessions count (with link to revoke all — admin action)
- Organization role: `administrator | dean | teacher | grade_editor | staff | student`
- Account created at, last sign-in at
- Password set: yes / no (for accounts created without password, e.g. invited)

---

## Tab: Enrollment — students only

### Current enrollment card
- Academic year (name, dates)
- Class (code, name, level, cycle)
- Enrollment status (active / pending / withdrawn)
- Program + option
- Registration number

### Enrollment history table
Columns: Academic Year | Class | Status | Registration Number | Actions (view results)

---

## Tab: Results — students only

### Per-academic-year accordion

Each year expands to show:

**UE summary table**
| UE Code | UE Name | Semester | Coeff | Average | Credits Earned | Decision |
|---|---|---|---|---|---|---|

**Course detail** (expandable within each UE row)
| Course Code | Course Name | CC | Exam | Average × Coeff | |

**Year summary row**
- General average (credit-weighted: Σ(UE_avg × UE_credits) / Σ(UE_credits))
- Total credits earned
- Deliberation decision (Admis / Ajourné / Exclu / En attente)
- Deliberation mention (Passable / Assez bien / Bien / Très bien / Excellent)

### Deliberation history table
| Academic Year | Type | Decision | Mention | Jury President | Date |

---

## Tab: Finances — students only

Requires the fee-clearance module to be configured for the institution.

- Current clearance status: badge (Cleared / Partial / Not cleared)
- Fee structure name + total amount
- Payments table: Date | Amount | Method | Reference | Status
- Outstanding balance

---

## Tab: Guardians — students only

List of linked guardian profiles:

| Name | Relationship | Email | Phone | Actions |
|---|---|---|---|---|
| … | Father / Mother / Guardian / … | … | … | View profile / Remove link |

**Add guardian** action (search existing domain users or create new).

---

## Tab: Documents — students only

Table of generated documents for this student:

| Document Type | Academic Year | Generated At | Template Used | Actions |
|---|---|---|---|---|
| Relevé de notes | 2024 | 2025-06-01 | Standard | Download / Regenerate |
| Attestation d'inscription | 2024 | 2025-09-15 | IPES | Download |

---

## Tab: Courses — teachers & grade editors

Shows current academic year's assigned courses:

| Class | Course Code | Course Name | UE | Students | Grades Submitted | Exam Status |
|---|---|---|---|---|---|---|

**Grade submission status** per course: Not started / Partial (X/Y submitted) / Complete / Locked.

Click on a course row → opens `/teacher/grades/:courseId` (for the teacher) or `/admin/grades` filtered to that course.

---

## Tab: Attendance — teachers only

Aggregated attendance data for courses this teacher manages:

- Alert count (students below threshold per course)
- Per-course attendance rate chart (reuse existing `AttendanceRates` component)

---

## Tab: Workflows — teachers, grade editors, deans

History of workflow actions (grade change requests, approval chains):

| Date | Type | Course | Student | Action taken | Status |
|---|---|---|---|---|---|

---

## Access Control

| Viewer role | Visible profiles | Editable fields |
|---|---|---|
| `super_admin` / `administrator` | All profiles in the institution | All (Identity + Account) |
| `dean` | Profiles in their faculty's programs | Identity (read-only) |
| `teacher` | Their own profile only | Identity (own) |
| `student` | Their own profile only | Identity (own, same as /settings) |
| `guardian` | Their linked students' profiles | None (read-only) |

> Admins can see all tabs for all roles. A student viewing their own profile sees Identity, Enrollment, Results, Finances, Documents (no Account tab).

---

## Data Sources

| Tab | Primary tables |
|---|---|
| Identity | `domainUsers` |
| Account | `user` (auth), `member`, `session` |
| Enrollment | `enrollments`, `classes`, `academicYears`, `studyCycles`, `cycleLevels`, `programs` |
| Results | `studentCourseEnrollments`, `grades`, `teachingUnits`, `courses`, `deliberationStudentResults`, `deliberations` |
| Finances | `feeAssignmentBatches`, (payment records if available) |
| Guardians | `students` → `guardians` relationship |
| Documents | `diplomationDocuments` (or generated document log) |
| Courses | `classCourses`, `exams` |
| Attendance | attendance log tables |
| Workflows | `workflows`, `workflowSteps` |

---

## Open Questions for Validation

1. **URL namespace**: `/admin/profiles/:profileId` vs `/admin/people/:profileId` vs keeping within existing sections (`/admin/students/:id`, `/admin/users/:id`)?
   - Recommendation: `/admin/profiles/:profileId` as a unified namespace since a person can be both a student and a staff member.

2. **Self-service**: Should `/settings` remain the edit entry point for personal data, or should the profile page be editable inline for the current user too?
   - Recommendation: Keep `/settings` for self-edit; profile page is primarily an admin view with inline editing only for admins.

3. **Guardian tab on guardian profiles**: When viewing a guardian's profile, show their linked students list instead. Should this be a separate "Linked Students" tab or reuse the Guardians tab name?

4. **Admission applicants**: Should accepted applicants (who become domain users) have their admission record shown in the profile? Could be an additional "Admission" tab or a card in the Enrollment tab.

5. **Performance**: The Results tab aggregates grades across multiple years. Should it load all data eagerly or use per-year lazy loading?
   - Recommendation: Per-year lazy loading with accordion — only expand the current year by default.

6. **Role detection**: A domain user's role is determined by `member.role`. What happens if a person has multiple memberships (e.g., both a teacher in one program and a student)?
   - Current system: one member record per organization. This is not a current issue but worth noting.

---

## Out of Scope

- Creating new domain users (handled by existing modals in `/admin/students`, `/admin/users`)
- Password reset / email change for other users (admin action already in Better-Auth admin panel)
- Financial payment creation (handled by fee-clearance module)
- Enrollment creation (handled by `/admin/classes` → assignments tab)
