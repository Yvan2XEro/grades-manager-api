# UX Refactor Direction — Grades Manager
**Version:** 1.0 — April 2026  
**Status:** Specification  
**Scope:** `apps/web/` frontend only — zero backend changes required  

---

## Table of Contents

1. [Context & Goals](#1-context--goals)
2. [Design Principles](#2-design-principles)
3. [Design System Conventions](#3-design-system-conventions)
4. [Role Definitions & Mental Models](#4-role-definitions--mental-models)
5. [Navigation Architecture](#5-navigation-architecture)
6. [Page Inventory](#6-page-inventory)
   - [6.1 Pages to Delete](#61-pages-to-delete)
   - [6.2 Pages to Merge / Replace](#62-pages-to-merge--replace)
   - [6.3 Pages to Modify In-Place](#63-pages-to-modify-in-place)
   - [6.4 Pages to Create (New)](#64-pages-to-create-new)
7. [Page Specifications](#7-page-specifications)
8. [Shared Component Changes](#8-shared-component-changes)
9. [Route Map (Before → After)](#9-route-map-before--after)
10. [Implementation Phases](#10-implementation-phases)
11. [Technical Constraints & Notes](#11-technical-constraints--notes)

---

## 1. Context & Goals

### What the app does
Grades Manager is an academic grading system for higher-education institutions. It manages the full lifecycle of academic assessment: from curriculum structure to grade entry, deliberations, and student promotion.

### Why a UX refactor
The current app is **functionally complete** but organized around the **database schema**, not the **user's task**. Every page corresponds to a database table. Users with a task that spans multiple tables (e.g., "close the January exam session") must navigate 5–8 pages with no guidance.

### Goals of this refactor
1. **Task-oriented navigation** — group pages by what users are trying to accomplish, not by what DB table they edit.
2. **Reduce page count** — consolidate related pages that are always used together.
3. **Inline contextual actions** — move secondary actions (submit exam, delegate access) to the page where the context already exists, eliminating dedicated pages for single actions.
4. **Enrich role-specific views** — each role gets a dashboard that answers "what do I need to do right now?".
5. **Fix critical performance regressions** — the Teacher Dashboard makes sequential N+1 API calls; replace with a single tRPC query.

### What this refactor does NOT change
- All tRPC procedures — no backend changes.
- Data models, auth, permissions.
- Component library (shadcn/ui) — only composition changes.
- i18n structure — new keys must be added; none removed until cleanup pass.

---

## 2. Design Principles

These principles must be applied consistently across every page in this refactor.

### P1 — Show the task, not the table
Page titles and navigation labels should reflect user intent:  
✗ "Class Course Management"  
✓ "Courses & Assignments"

### P2 — Status drives the UI
Every entity that has a status (exam, deliberation, enrollment window) must render that status visibly and make the **next logical action** the primary CTA. Do not show all possible actions equally.

Example: An exam in `submitted` status should display "Approve" as the primary button (for dean) or "Awaiting approval" as a passive badge (for teacher). Delete should be in a secondary dropdown.

### P3 — Progressive disclosure
Show summary first, detail on expand or navigate. Avoid pages that are only one-level deep tables with no drill-down. Avoid pages that open dialogs that open dialogs.

### P4 — Zero dead ends
Every empty state must have a contextual CTA that leads to the action that would fill it.  
Example: "No exams yet" → button "Create first exam" that opens the exam creation modal pre-filled with the current course context.

### P5 — Confirmation = context
Every confirmation dialog for destructive actions must show the impact: how many related records will be deleted. No generic "Are you sure?" dialogs.

### P6 — Consistent status semantics
Status badges must use consistent color tokens across the entire app:

| Status | Color Token |
|---|---|
| `draft` | `secondary` (grey) |
| `open` | `default` (blue) |
| `locked` | `outline` with lock icon (dark border) |
| `submitted` | `warning` (amber) — add this token |
| `approved` | `success` (green) — add this token |
| `rejected` | `destructive` (red) |
| `closed` | `secondary` (grey) |
| `signed` | `success` (green) |

### P7 — No orphan pages
Every page must be reachable from the sidebar or from a contextual link within the natural user flow. Remove any route that is not linked from anywhere visible.

---

## 3. Design System Conventions

### 3.1 New Badge Variants

Add to `components/ui/badge.tsx`:

```tsx
// Add these two variants to the cva() call
"warning": "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
"success": "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
```

Use `"warning"` for `submitted` exam status.  
Use `"success"` for `approved`, `signed` statuses.

### 3.2 Page Layout Pattern

All pages must follow this exact structure:

```tsx
<div className="space-y-6">
  {/* 1. Page header — always present */}
  <PageHeader
    title="Page Title"
    description="One-line description of what this page is for"
    actions={<Button>Primary Action</Button>}
  />

  {/* 2. Filter bar — only when filtering is available */}
  <FilterBar ... />

  {/* 3. Content */}
  <ContentArea />
</div>
```

Create a new shared `PageHeader` component:

```tsx
// src/components/ui/page-header.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}
```

### 3.3 Status Progress Stepper

Create a new `StatusStepper` component for entities with linear status flows:

```tsx
// src/components/ui/status-stepper.tsx
interface Step { key: string; label: string; }
interface StatusStepperProps {
  steps: Step[];         // ordered list of all possible statuses
  currentStatus: string; // which step is active
  rejectedStatus?: string; // if set and matches currentStatus, show red
}
```

Used on: Exam detail, Deliberation detail.

### 3.4 ProgressBar with Count

Extend or create a `GradingProgress` component:

```tsx
// src/components/ui/grading-progress.tsx
interface GradingProgressProps {
  graded: number;
  total: number;
  showMissing?: boolean; // if true, shows "View missing" link
}
// Renders: [████████░░] 28 / 35 graded
```

### 3.5 EmptyState with CTA

Replace existing `Empty` usage with a unified component that always accepts a `cta` prop:

```tsx
// src/components/ui/empty-state.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  cta?: { label: string; onClick: () => void; icon?: React.ReactNode };
}
```

---

## 4. Role Definitions & Mental Models

Each role has one primary mental model. The UI must serve that model on every page.

### Admin
**Mental model:** "I configure and oversee everything."  
**Primary tasks:**
1. Set up the academic structure for a new year (faculties → programs → classes → courses)
2. Manage users and students (add, import, enroll)
3. Monitor the assessment cycle (who hasn't submitted? what's pending deliberation?)

**Critical flows:**  
`Create academic year` → `Activate year` → `Create classes` → `Assign courses & teachers` → `Monitor exam submission progress` → `Launch deliberations` → `Run promotion`

### Teacher
**Mental model:** "I teach courses and enter grades."  
**Primary tasks:**
1. Enter grades for my exams
2. Submit exams for approval once all grades are entered
3. Export my gradebook

**Critical flows:**  
`See my courses` → `Select exam` → `Enter grades` → `Lock exam` → `Submit to dean`

### Grade Editor
**Mental model:** Same as Teacher but with no ownership — I was delegated access.  
Same flows as Teacher; same UI. The difference is enforced server-side.

### Dean
**Mental model:** "I validate grade submissions."  
**Primary tasks:**
1. Review submitted exams and approve or reject them
2. Monitor overall progress

**Critical flow:**  
`See pending approvals` → `Review grades` → `Approve or Reject with reason`

### Student
**Mental model:** "How am I doing?"  
**Primary tasks:**
1. See my grades by course and semester
2. Understand my credit progress
3. Know if I passed or need to retake something

---

## 5. Navigation Architecture

### 5.1 Admin Sidebar (New Structure)

Reduce from 7 groups / ~30 items to **4 groups / 15 items**:

```
OVERVIEW
  ├── Dashboard                    /admin
  └── Academic Years               /admin/academic-years

STRUCTURE
  ├── Institution & Faculties      /admin/institution        (tabs: institution | faculties | study cycles)
  ├── Programs & Curriculum        /admin/programs           (tabs: programs | teaching units | courses)
  └── Classes & Enrollments        /admin/classes            (tabs: classes | class courses | enrollments)

PEOPLE
  ├── Students                     /admin/students
  └── Users & Access               /admin/users              (tabs: users | api keys)

ASSESSMENT
  ├── Exams                        /admin/exams              (tabs: all exams | types | scheduler)
  ├── Grade Management             /admin/grades             (tabs: export | access grants | retake eligibility)
  ├── Deliberations                /admin/deliberations
  └── Promotion                    /admin/promotion          (tabs: rules | evaluate | execute | history)

SYSTEM
  ├── Configuration                /admin/configuration      (tabs: registration numbers | export templates | rules engine)
  ├── Monitoring                   /admin/monitoring
  ├── Batch Jobs                   /admin/batch-jobs
  └── Notifications                /admin/notifications
```

**Implementation note:** The sidebar groups remain collapsible with the same Framer Motion behavior. The search bar in expanded mode works unchanged. The only change is the items and their paths.

### 5.2 Teacher Sidebar

```
  ├── My Courses & Grades          /teacher              (replaces Dashboard + CourseList + GradeEntry)
  ├── Attendance Alerts            /teacher/attendance
  └── Exports                      /teacher/exports
```

Remove: `/teacher/workflows` (submit action moves inline to course/grade view).

### 5.3 Dean Sidebar

```
  ├── Pending Approvals            /dean                 (replaces MonitoringDashboard as index)
  ├── Approval History             /dean/history
  └── Monitoring                   /dean/monitoring
```

### 5.4 Grade Editor Sidebar

```
  ├── My Delegated Courses         /grade-editor         (same as teacher view, filtered to delegated courses)
  └── Exports                      /grade-editor/exports
```

Remove: `/grade-editor/courses` (redundant route — `/grade-editor` is the course list).

### 5.5 Student Sidebar

```
  └── My Academic Record           /student              (enhanced dashboard)
```

No change to structure, but the page content changes significantly (see §7).

---

## 6. Page Inventory

### 6.1 Pages to Delete

These routes and their source files should be **removed entirely**. Their functionality is absorbed into merged pages described in §6.2 and §6.4.

| Route | File | Reason |
|---|---|---|
| `/teacher/workflows` | `pages/teacher/WorkflowManager.tsx` | Submit action moves inline to grade entry / course card |
| `/grade-editor/courses` | `pages/teacher/CourseList.tsx` (basePath variant) | `/grade-editor` index becomes the course list |
| `/admin/exam-types` | `pages/admin/ExamTypes.tsx` | Becomes a tab inside `/admin/exams` |
| `/admin/exam-scheduler` | `pages/admin/ExamScheduler.tsx` | Becomes a tab inside `/admin/exams` |
| `/admin/retake-eligibility` | `pages/admin/RetakeEligibility.tsx` | Becomes a tab inside `/admin/grades` |
| `/admin/grade-access` | `pages/admin/GradeAccessGrants.tsx` | Becomes a tab inside `/admin/grades` |
| `/admin/grade-export` | `pages/admin/GradeExport.tsx` | Becomes a tab inside `/admin/grades` |
| `/admin/faculties` | `pages/admin/FacultyManagement.tsx` | Becomes a tab inside `/admin/institution` |
| `/admin/study-cycles` | `pages/admin/StudyCycleManagement.tsx` | Becomes a tab inside `/admin/institution` |
| `/admin/teaching-units` | `pages/admin/TeachingUnitManagement.tsx` | Becomes a tab inside `/admin/programs` |
| `/admin/teaching-units/:id` | `pages/admin/TeachingUnitDetail.tsx` | Absorbed into programs tab detail panel |
| `/admin/courses` | `pages/admin/CourseManagement.tsx` | Becomes a tab inside `/admin/programs` |
| `/admin/class-courses` | `pages/admin/ClassCourseManagement.tsx` | Becomes a tab inside `/admin/classes` |
| `/admin/enrollments` | `pages/admin/EnrollmentManagement.tsx` | Becomes a tab inside `/admin/classes` |
| `/admin/student-promotion` | (duplicate route of `/admin/students`) | Duplicate route — already removed logically |
| `/admin/rules` | `pages/admin/RuleManagement.tsx` | Becomes a tab inside `/admin/configuration` |
| `/admin/registration-numbers` | `pages/admin/RegistrationNumberFormats.tsx` | Becomes a tab inside `/admin/configuration` |
| `/admin/registration-numbers/:id` | `pages/admin/RegistrationNumberFormatDetail.tsx` | Opens as a slide-over panel inside configuration tab |
| `/admin/api-keys` | `pages/admin/ApiKeysManagement.tsx` | Becomes a tab inside `/admin/users` |
| `/admin/promotion-rules` | `pages/admin/promotion-rules/dashboard.tsx` | `/admin/promotion` becomes the entry with tabs |
| `/admin/promotion-rules/rules` | `pages/admin/promotion-rules/rules-list.tsx` | Tab in `/admin/promotion` |
| `/admin/promotion-rules/evaluate` | `pages/admin/promotion-rules/evaluate-promotion.tsx` | Tab in `/admin/promotion` |
| `/admin/promotion-rules/execute` | `pages/admin/promotion-rules/execute-promotion.tsx` | Tab in `/admin/promotion` |
| `/admin/promotion-rules/history` | `pages/admin/promotion-rules/execution-history.tsx` | Tab in `/admin/promotion` |
| `/teacher/courses` | `pages/teacher/CourseList.tsx` | `/teacher` index becomes the course+grade hub |
| `/teacher/grades` | `pages/teacher/GradeEntry.tsx` | Grade entry becomes a nested view within the course hub |
| `/teacher/grades/:courseId` | `pages/teacher/GradeEntry.tsx` | Same — replaced by the hub's inline grade view |
| `/dean` index | `pages/admin/MonitoringDashboard.tsx` (reused) | Dean gets its own `PendingApprovals` dashboard |

**IMPORTANT:** Do not delete the source component files immediately. During the transition, many of these components will be **imported and rendered as tab content** inside the merged pages. Only delete the file once the merged page is complete and the route is removed from `App.tsx`.

### 6.2 Pages to Merge / Replace

These pages replace multiple existing routes with a single tabbed page.

| New Route | New File | Replaces Routes |
|---|---|---|
| `/admin/institution` | `pages/admin/InstitutionHub.tsx` | `/admin/institution` + `/admin/faculties` + `/admin/study-cycles` |
| `/admin/programs` | `pages/admin/ProgramsHub.tsx` | `/admin/programs` + `/admin/teaching-units` + `/admin/teaching-units/:id` + `/admin/courses` |
| `/admin/classes` | `pages/admin/ClassesHub.tsx` | `/admin/classes` + `/admin/class-courses` + `/admin/enrollments` |
| `/admin/exams` | `pages/admin/ExamsHub.tsx` | `/admin/exams` + `/admin/exam-types` + `/admin/exam-scheduler` |
| `/admin/grades` | `pages/admin/GradesHub.tsx` | `/admin/grade-export` + `/admin/grade-access` + `/admin/retake-eligibility` |
| `/admin/users` | `pages/admin/UsersHub.tsx` | `/admin/users` + `/admin/api-keys` |
| `/admin/promotion` | `pages/admin/PromotionHub.tsx` | All 5 `/admin/promotion-rules/*` routes |
| `/admin/configuration` | `pages/admin/ConfigurationHub.tsx` | `/admin/rules` + `/admin/registration-numbers` + `/admin/registration-numbers/:id` + `/admin/export-templates` + `/admin/export-templates/:id` |
| `/teacher` | `pages/teacher/TeacherHub.tsx` | `/teacher` + `/teacher/courses` + `/teacher/grades` + `/teacher/grades/:courseId` + `/teacher/workflows` |
| `/dean` | `pages/dean/DeanDashboard.tsx` | `/dean` (MonitoringDashboard → replaced with PendingApprovals) |
| `/grade-editor` | (reuse `TeacherHub.tsx`) | `/grade-editor` + `/grade-editor/courses` + `/grade-editor/grades` + `/grade-editor/grades/:courseId` |

### 6.3 Pages to Modify In-Place

These pages keep their route and file but require content changes.

| Route | File | Changes Required |
|---|---|---|
| `/admin` | `pages/admin/Dashboard.tsx` | Add "Action needed" section (exams pending approval, deliberations open). Fix stat card empty states with CTAs. |
| `/admin/academic-years` | `pages/admin/AcademicYearManagement.tsx` | Add visual "current active year" highlight. Add "Setup wizard" CTA for first-time use. |
| `/admin/students` | `pages/admin/StudentManagement.tsx` | Add CSV import preview dialog (client-side row validation before submit). Add cascade delete impact count. |
| `/admin/deliberations` | `pages/admin/deliberations/DeliberationsList.tsx` | Add StatusStepper to the list view. Fix badge colors to use new semantic tokens. Default filter to `open` status. |
| `/admin/deliberations/:id` | `pages/admin/deliberations/DeliberationDetail.tsx` | Add StatusStepper at top. Add "Promote admitted students" CTA prominently. |
| `/admin/monitoring` | `pages/admin/MonitoringDashboard.tsx` | No structural change — only remove from Dean's index route. |
| `/student` | `pages/student/PerformanceDashboard.tsx` | Complete content overhaul (see §7.6). |
| `/auth/login` | `pages/auth/Login.tsx` | Remove "Register" link or make it conditional (see §7.7). Add "Remember me" checkbox. |
| `/auth/forgot` | `pages/auth/ForgotPassword.tsx` | Add "← Back to login" link. |
| `/auth/reset` | `pages/auth/ResetPassword.tsx` | Add "← Back to login" link. Add success state with auto-redirect countdown. |
| `/settings` | `pages/AccountSettings.tsx` | No structural change needed in this pass. |
| `/dean/history` | (new — see §6.4) | — |
| `/dean/monitoring` | Reuse `MonitoringDashboard.tsx` | Move dean's monitoring here from index. |

### 6.4 Pages to Create (New)

These are net-new files with no current equivalent.

| Route | File | Description |
|---|---|---|
| `/admin/institution` (hub) | `pages/admin/InstitutionHub.tsx` | Tabbed page: Institution Settings \| Faculties \| Study Cycles |
| `/admin/programs` (hub) | `pages/admin/ProgramsHub.tsx` | Tabbed page: Programs \| Teaching Units \| Courses. Teaching unit detail opens as a right side panel. |
| `/admin/classes` (hub) | `pages/admin/ClassesHub.tsx` | Tabbed page: Classes \| Course Assignments \| Enrollments |
| `/admin/exams` (hub) | `pages/admin/ExamsHub.tsx` | Tabbed page: Exams \| Exam Types \| Exam Scheduler |
| `/admin/grades` (hub) | `pages/admin/GradesHub.tsx` | Tabbed page: Export \| Access Grants \| Retake Eligibility |
| `/admin/users` (hub) | `pages/admin/UsersHub.tsx` | Tabbed page: Users \| API Keys |
| `/admin/promotion` (hub) | `pages/admin/PromotionHub.tsx` | Tabbed page: Overview \| Rules \| Evaluate \| Execute \| History |
| `/admin/configuration` (hub) | `pages/admin/ConfigurationHub.tsx` | Tabbed page: Registration Numbers \| Export Templates \| Rules Engine. Detail views open as slide-over panels. |
| `/teacher` (hub) | `pages/teacher/TeacherHub.tsx` | Course-centric grade entry hub (see §7.3) |
| `/teacher/exports` | `pages/teacher/TeacherExports.tsx` | Move export functionality from GradeEntry into dedicated page |
| `/dean` (new dashboard) | `pages/dean/DeanDashboard.tsx` | Pending approvals with rich exam context (see §7.4) |
| `/dean/history` | `pages/dean/ApprovalHistory.tsx` | Past approvals/rejections with filter by date/course/class |
| `/dean/monitoring` | (alias to `MonitoringDashboard.tsx`) | Same monitoring page, new route for dean |

---

## 7. Page Specifications

### 7.1 Hub Pattern (applies to all `*Hub.tsx` pages)

Every hub page follows this template:

```
┌─────────────────────────────────────────────────────┐
│ PageHeader: Title + description + primary action     │
├──────────────────────────────────────────────────────┤
│ Tabs: [Tab 1] [Tab 2] [Tab 3]                        │
│ ─────────────────────────────────────────────────── │
│                                                      │
│ <Tab content — renders the existing page component>  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Implementation:** Use shadcn `Tabs` component (`components/ui/tabs`). Each tab renders the existing page component (e.g., `<FacultyManagement />`) as its content. The existing components do not need to be modified for this to work — they are simply composed inside a tab panel.

**URL persistence:** Persist the active tab in the URL as a search param: `?tab=faculties`. Use `useQueryState('tab')` from `nuqs` (already a dependency).

**Example — InstitutionHub.tsx:**
```tsx
export default function InstitutionHub() {
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'institution' });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution & Structure"
        description="Manage your institution profile, faculties, and academic cycles"
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="institution">Institution</TabsTrigger>
          <TabsTrigger value="faculties">Faculties</TabsTrigger>
          <TabsTrigger value="cycles">Study Cycles</TabsTrigger>
        </TabsList>
        <TabsContent value="institution"><InstitutionSettings /></TabsContent>
        <TabsContent value="faculties"><FacultyManagement /></TabsContent>
        <TabsContent value="cycles"><StudyCycleManagement /></TabsContent>
      </Tabs>
    </div>
  );
}
```

Apply this exact pattern for all hub pages. The effort per hub page is low — the complexity is already in the existing components.

---

### 7.2 Admin Dashboard — Modifications

**File:** `pages/admin/Dashboard.tsx`

**Add an "Action Needed" section** above the stat cards. This section is only rendered when there is actionable data.

```
┌─────────────────────────────────────────────────────┐
│ Good morning, Jean-Paul                             │
│ Here's what needs your attention today             │
├─────────────────────────────────────────────────────┤
│ ⚠ ACTION NEEDED                                    │
│ ┌──────────────────────┐ ┌──────────────────────┐  │
│ │ 3 exams awaiting     │ │ 1 deliberation is    │  │
│ │ approval             │ │ open since 5 days    │  │
│ │ [View pending →]     │ │ [View deliberation →]│  │
│ └──────────────────────┘ └──────────────────────┘  │
├─────────────────────────────────────────────────────┤
│ STATS (existing animated cards)                    │
│ [Users] [Faculties] [Programs] [Classes] ...        │
├─────────────────────────────────────────────────────┤
│ CHARTS (existing bar chart + pie chart)            │
└─────────────────────────────────────────────────────┘
```

**Data needed (existing tRPC endpoints):**
- Count of exams with `status: 'submitted'` → link to `/admin/exams?tab=exams&status=submitted`
- Count of deliberations with `status: 'open'` → link to `/admin/deliberations`

**Empty state fix:** When a stat card shows `0`, replace the `ArrowUpRight` icon with a `Plus` icon and change the card link behavior: clicking a `0` card opens the creation modal for that entity rather than navigating to the list.

---

### 7.3 Teacher Hub — New Page

**File:** `pages/teacher/TeacherHub.tsx`  
**Route:** `/teacher` (index)  
**Replaces:** Dashboard + CourseList + GradeEntry + WorkflowManager

This is the most important new page. It is the teacher's entire workspace.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│ My Courses — Spring 2026                            │
│ [Search courses...]           [Export all grades ↓]│
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ MATHEMATICS L1  ·  35 students  ·  4 exams      │ │
│ │ ─────────────────────────────────────────────── │ │
│ │ CC1   [███████░░░] 30/35  ·  Avg 12.4  [Lock ✓] │ │
│ │ DS    [████████░░] 28/35  ·  not locked  [Enter]│ │
│ │ EX    [░░░░░░░░░░]  0/35  ·  not started  [—]   │ │
│ │                                                  │ │
│ │ Status: 1 exam ready to submit                  │ │
│ │ [Submit CC1 for approval →]                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ PHYSICS L2  ·  28 students  ·  2 exams          │ │
│ │ ─────────────────────────────────────────────── │ │
│ │ CC1   [████████████] 28/28  ·  Submitted ✓      │ │
│ │ DS    [░░░░░░░░░░░░]  0/28  ·  not started [—]  │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### Detailed behavior

**Course Card (`TeacherCourseCard` component):**
- Shows: course name, class name, student count, active academic year
- Delegated badge if teacher is not the owner
- Collapsible (click header) — default: expanded for courses with pending action; collapsed for fully submitted courses

**Exam Row inside card:**
- Progress bar: `graded / total` students
- Average if at least 1 grade exists
- Status badge using semantic colors (see §3.1)
- Primary CTA per exam status:

| Exam Status | CTA shown |
|---|---|
| Not locked, incomplete | `[Enter grades →]` (button) |
| Not locked, all graded | `[Lock exam]` (button) |
| Locked, not submitted | `[Submit for approval]` (button) |
| Submitted | `Awaiting approval` (passive badge) |
| Approved | `Approved ✓` (success badge) |
| Rejected | `[View rejection reason]` (button, opens modal with reason) |

**Grade entry panel:**  
Clicking `[Enter grades →]` **expands an inline panel below the exam row** (accordion-style). No full-page navigation.

```
│ ▼ DS — Entering grades                              │
│ ────────────────────────────────────────────────── │
│ [███████████░] 28 / 35 graded  [Show 7 missing ▼] │
│                                                    │
│  Search student...              [Import] [Template]│
│                                                    │
│  # Reg. Number  Name            Score   Status     │
│  1 2024-001     Alice Martin    14      ✓ Graded   │
│  2 2024-002     Bob Nguyen      —       ○ Missing  │
│  ...                                               │
│                                                    │
│  [Save all]                    [Lock exam when done]│
```

The grade table is identical to the current `GradeEntry.tsx` table — copy the table component and the save/lock/import logic. The difference is rendering context: inline panel vs full page.

**Performance fix (N+1 queries):**  
The current `TeacherDashboard.tsx` makes sequential API calls in a for-loop (one per course). Replace with a single tRPC query:  

```ts
// Use this existing endpoint instead of the cascade:
trpc.classCourses.list.queryOptions({ teacherId: user.id, limit: 200 })
// Then fetch exam counts and progress in one batch:
trpc.exams.list.queryOptions({ teacherId: user.id }) // if this doesn't exist, request it; 
// or use Promise.all([]) for parallel (not sequential) fetches
```

If a batch endpoint does not exist on the backend, replace the `for...await` loop with `Promise.all()` — this alone reduces load time from ~5 seconds to ~500ms without any backend changes.

**Delegation section:**  
Move the delegate management section (currently at the bottom of `GradeEntry.tsx`) to a `[Manage delegates]` button that opens a modal. Keep it per-exam.

---

### 7.4 Dean Dashboard — New Page

**File:** `pages/dean/DeanDashboard.tsx`  
**Route:** `/dean` (index)  
**Replaces:** `MonitoringDashboard` as dean index

#### Layout

```
┌─────────────────────────────────────────────────────┐
│ Grade Approvals                                     │
│ 3 exams awaiting your review                        │
├─────────────────────────────────────────────────────┤
│ Filters: [All classes ▼] [All programs ▼]  [Search] │
│                                                     │
│ ┌──────────────────────────────────────────────────┐│
│ │ □ Mathematics — L1 — S1                          ││
│ │   CC1 (30%) · Submitted by M. Dupont · 2 days ago││
│ │   ─────────────────────────────────────────────  ││
│ │   35/35 graded  ·  Avg: 12.4  ·  Min: 4  Max: 19││
│ │                                                  ││
│ │   [View grades]    [Reject ✗]    [Approve ✓]     ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ ┌──────────────────────────────────────────────────┐│
│ │ □ Physics — L2 — S1                              ││
│ │   ...                                            ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ [Select all]  [Approve selected (2)]                │
└─────────────────────────────────────────────────────┘
```

#### Key changes from current WorkflowApprovals

1. **Filter to `submitted` only** — change the query:
   ```ts
   // CURRENT (shows all exams):
   trpc.exams.list.queryOptions({})
   
   // NEW (submitted only):
   trpc.exams.list.queryOptions({ status: 'submitted' })
   ```

2. **Rich context per exam** — show: course name, class, teacher name, submission date (from `submittedAt` or workflow timestamp), grading progress (`X/Y`), average, min, max.  
   The data for `avg/min/max` can be computed client-side from the grades returned by `trpc.grades.listByExam.query({ examId })`, loaded lazily when the card expands.

3. **Reject with reason** — current implementation has no rejection reason. Add a `RejectExamDialog` with a required `reason` text field. Pass reason to `workflows.validateGrades` or add a separate `workflows.rejectGrades` call.

4. **"View grades" inline expand** — same accordion pattern as Teacher Hub. Clicking "View grades" expands a read-only grade table inline.

5. **Notifications section** — move to `/dean/monitoring`, not on this page.

---

### 7.5 Student Performance Dashboard — Overhaul

**File:** `pages/student/PerformanceDashboard.tsx`  
**Route:** `/student` (index)

#### Layout

```
┌─────────────────────────────────────────────────────┐
│ Alice Martin — Licence 1  ·  Computer Science       │
│ Academic Year 2025–2026                             │
├──────────┬──────────┬───────────────────────────────┤
│ GPA      │ Credits  │  Rank (if available)          │
│ 13.4/20  │ 42 / 60  │  8 / 35                       │
│ [████░░] │ [██████░]│                               │
├──────────┴──────────┴───────────────────────────────┤
│ SEMESTER 1 — Avg: 14.2  ·  30 credits earned       │
│ ─────────────────────────────────────────────────  │
│ UE: Mathematics (coeff 3)                           │
│   CC1: 15  ·  DS: 13  ·  EX: 14  →  Avg: 14.0  ✓  │
│   Credits: 6 / 6                                    │
│                                                     │
│ UE: Physics (coeff 2)                               │
│   CC1: 12  ·  EX: 11  →  Avg: 11.5  ✓              │
│   Credits: 4 / 4                                    │
│                                                     │
│ ─────────────────────────────────────────────────  │
│ SEMESTER 2 — Avg: pending                          │
│   [Exams not yet graded]                            │
├─────────────────────────────────────────────────────┤
│ UPCOMING EXAMS (if any are open/scheduled)          │
│ Physics Retake — May 15, 2026  [Retake exam]        │
└─────────────────────────────────────────────────────┘
```

#### Data requirements

All data is available through existing endpoints:

- `trpc.studentCreditLedger.summary` — credits earned, required, in progress ✓ (already used)
- `trpc.students.getById` — student profile ✓ (already used)
- `trpc.classes.getById` — class info ✓ (already used)
- `trpc.grades.listByExam` — **needs to be called per exam** OR use a dedicated student transcript endpoint if one exists. Check if `trpc.grades.transcript` or similar exists in the backend. If not, the frontend can reconstruct from `studentCourseEnrollments` data.
- For the GPA: use the `generalAverage` value already computed by the credit ledger (it's part of the summary response or can be derived from UE averages × credits).

**If a student transcript endpoint does not exist:** Create a query that fetches all the student's course enrollments grouped by semester. The backend module `student-course-enrollments` should have a list endpoint. Use that + `exams.list` per course to build the grade table client-side. Keep it parallel with `Promise.all`.

#### Upcoming exams section
Show exams where `sessionType: 'retake'` or `status: 'open'` that belong to the student's current class. Use `trpc.exams.list({ classId: studentClassId, status: 'open' })`.

---

### 7.6 ExamsHub — Retake Eligibility + Create Retake Flow

**File:** `pages/admin/ExamsHub.tsx`  
**Route:** `/admin/exams`  
**Tabs:** Exams | Exam Types | Exam Scheduler

#### Retake creation (new flow within Exams tab)

Currently, an admin must:
1. Navigate to RetakeEligibility to see who is eligible
2. Navigate to ExamManagement to create a retake exam manually

**New flow:** On the Exams tab, when an exam has `status: 'approved'`, show a "Create retake" button. Clicking it opens a pre-filled `CreateExamDialog` with:
- `sessionType` pre-set to `retake`
- `parentExamId` pre-set to the source exam's ID
- `classCourse` pre-set from the source exam

The RetakeEligibility page (absorbed as a tab in `/admin/grades`) remains for checking per-student eligibility, but the creation action is now contextual.

---

### 7.7 Auth Pages — Modifications

**File:** `pages/auth/Login.tsx`

1. **Remove or condition the "Register" link.** In a university context, accounts are created by admins. The register link misleads students who try to self-register.  
   - **Option A (recommended):** Remove the link entirely. The `Register` page stays accessible at `/auth/register` for the rare valid use case (e.g., admin creating their first account).  
   - **Option B:** Show the link only if `VITE_ALLOW_SELF_REGISTER=true` env var is set.

2. **Add "Remember me" checkbox.** 
   ```tsx
   <div className="flex items-center gap-2">
     <Checkbox id="remember" {...register('remember')} />
     <Label htmlFor="remember">Remember me for 30 days</Label>
   </div>
   ```
   Pass `rememberMe: data.remember` to `authClient.signIn.email()` — Better-Auth supports this.

**File:** `pages/auth/ForgotPassword.tsx` and `pages/auth/ResetPassword.tsx`

Add a back link at the top:
```tsx
<Link to="/auth/login" className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
</Link>
```

On `ResetPassword.tsx`, after successful reset, show a success state:
```
✓ Password updated successfully
You will be redirected to sign in in 3 seconds...
[Sign in now →]
```
Use a `useEffect` with `setTimeout` + `navigate('/auth/login')`.

---

### 7.8 Student Import — CSV Preview Dialog

**File:** `pages/admin/StudentManagement.tsx`

Replace the current "upload and hope" flow with a two-step import:

**Step 1 — Upload:** User selects a file. Client-side JS parses the CSV/XLSX using the existing `xlsx` dependency and shows a preview table.

**Step 2 — Preview with validation:**
```
Import preview: students.xlsx

  Row  Registration  First Name  Last Name  Email              Issues
  ──────────────────────────────────────────────────────────────────
  1    2024-001      Alice       Martin     alice@u.edu        ✓ OK
  2    2024-002      Bob         (empty)    bob@u.edu          ✗ Last name missing
  3    2024-003      Carol       Lee        not-an-email       ✗ Invalid email
  4    (dup)         Dave        Clark      dave@u.edu         ⚠ Reg. # duplicate

  3 valid · 2 errors · 1 warning
  Rows with errors will be skipped.

  [Cancel]                          [Import 3 valid rows →]
```

**Implementation:** Parse the file in `onChange` of the file input before the form submit. Use `xlsx.utils.sheet_to_json()` to get row objects. Validate each row against a Zod schema (reuse the schema from the form). Store validation results in local state. Only submit valid rows.

This requires **no backend changes** — only the submit payload changes (pre-filtered rows instead of raw file).

---

### 7.9 Cascade Delete Impact Dialog

Replace all generic `ConfirmModal` instances that involve cascading deletes with a `CascadeDeleteDialog` component that shows the count of affected records.

**Create:** `components/ui/cascade-delete-dialog.tsx`

```tsx
interface CascadeDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;        // e.g., "Course Assignment"
  impacts: Array<{
    label: string;            // e.g., "Exams"
    count: number;            // e.g., 4
  }>;
  isLoading?: boolean;
}
```

**Usage example (ClassCourseManagement):**
```
Delete "Mathematics L1 — Spring 2026"?

This will permanently delete:
  · 4 exams
  · 140 grade records

This action cannot be undone.

[Cancel]   [Delete everything]
```

The impact counts should be fetched **before** opening the dialog. Add a query to count related records (use existing `exams.list` and count the result, no new endpoint needed).

Apply to: class-course deletion, program deletion, faculty deletion.

---

## 8. Shared Component Changes

### 8.1 Sidebar — Item updates only

The Sidebar component (`components/navigation/Sidebar.tsx`) does **not** need structural changes. Only update the `adminGroups` array and the flat menus for teacher/dean to match the new routes and labels defined in §5.

The collapsible logic, search, animation, responsive behavior — all unchanged.

### 8.2 PageHeader (new component)

```tsx
// src/components/ui/page-header.tsx
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <h1 className="text-foreground truncate">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
```

Apply to every page (hub pages first, then in-place modifications).

### 8.3 StatusStepper (new component)

```tsx
// src/components/ui/status-stepper.tsx
// Renders a horizontal stepper showing status progression.
// Steps to the left of currentStatus are "completed" (filled circle).
// Current step is "active" (ring + filled).
// Future steps are "pending" (empty circle).
// If rejectedStatus matches currentStatus, the current step is red.
```

Apply to: ExamManagement rows, DeliberationDetail header.

### 8.4 GradingProgress (new component)

```tsx
// src/components/ui/grading-progress.tsx
// [████████░░] 28 / 35  (7 missing)
// Props: graded, total, showMissing (bool)
// Clicking "7 missing" scrolls to or highlights ungraded rows in parent table
```

### 8.5 Badge — semantic status helper

Add a utility function to remove the badge color lookup from every component:

```tsx
// src/lib/exam-status.ts
export function examStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    draft: 'secondary',
    open: 'default',
    locked: 'outline',
    submitted: 'warning',
    approved: 'success',
    rejected: 'destructive',
    scheduled: 'secondary',
    closed: 'secondary',
    signed: 'success',
  };
  return map[status] ?? 'secondary';
}
```

Replace the `statusVariants` object that is currently redefined in multiple files (ExamManagement, DeliberationsList, etc.).

---

## 9. Route Map (Before → After)

```
BEFORE                                  AFTER
──────────────────────────────────────────────────────────────────
/admin                               → /admin                     (modified)
/admin/institution                   → /admin/institution?tab=institution
/admin/faculties                     → /admin/institution?tab=faculties   (DELETED as route)
/admin/study-cycles                  → /admin/institution?tab=cycles      (DELETED as route)
/admin/programs                      → /admin/programs?tab=programs
/admin/teaching-units                → /admin/programs?tab=teaching-units (DELETED as route)
/admin/teaching-units/:id            → /admin/programs?tab=teaching-units (DELETED as route, panel)
/admin/courses                       → /admin/programs?tab=courses        (DELETED as route)
/admin/classes                       → /admin/classes?tab=classes
/admin/class-courses                 → /admin/classes?tab=assignments     (DELETED as route)
/admin/enrollments                   → /admin/classes?tab=enrollments     (DELETED as route)
/admin/academic-years                → /admin/academic-years              (modified)
/admin/students                      → /admin/students                    (modified)
/admin/users                         → /admin/users?tab=users
/admin/api-keys                      → /admin/users?tab=api-keys          (DELETED as route)
/admin/exams                         → /admin/exams?tab=exams
/admin/exam-types                    → /admin/exams?tab=types             (DELETED as route)
/admin/exam-scheduler                → /admin/exams?tab=scheduler         (DELETED as route)
/admin/retake-eligibility            → /admin/grades?tab=retake           (DELETED as route)
/admin/grade-export                  → /admin/grades?tab=export           (DELETED as route)
/admin/grade-access                  → /admin/grades?tab=access           (DELETED as route)
/admin/deliberations                 → /admin/deliberations               (modified)
/admin/deliberations/:id             → /admin/deliberations/:id           (modified)
/admin/deliberations/rules           → /admin/deliberations?tab=rules
/admin/graduation                    → /admin/deliberations?tab=graduation
/admin/promotion-rules               → /admin/promotion?tab=overview      (DELETED as route)
/admin/promotion-rules/rules         → /admin/promotion?tab=rules         (DELETED as route)
/admin/promotion-rules/evaluate      → /admin/promotion?tab=evaluate      (DELETED as route)
/admin/promotion-rules/execute       → /admin/promotion?tab=execute       (DELETED as route)
/admin/promotion-rules/history       → /admin/promotion?tab=history       (DELETED as route)
/admin/rules                         → /admin/configuration?tab=rules     (DELETED as route)
/admin/registration-numbers          → /admin/configuration?tab=reg-numbers (DELETED as route)
/admin/registration-numbers/:id      → /admin/configuration?tab=reg-numbers (DELETED as route, panel)
/admin/export-templates              → /admin/configuration?tab=templates (DELETED as route)
/admin/export-templates/:id          → /admin/configuration?tab=templates (DELETED as route, panel)
/admin/monitoring                    → /admin/monitoring                  (unchanged)
/admin/batch-jobs                    → /admin/batch-jobs                  (unchanged)
/admin/batch-jobs/:id                → /admin/batch-jobs/:id              (unchanged)
/admin/notifications                 → /admin/notifications               (unchanged)

/teacher                             → /teacher  (TeacherHub)             (REPLACED)
/teacher/courses                     → /teacher  (DELETED as route)
/teacher/grades                      → /teacher  (DELETED as route)
/teacher/grades/:courseId            → /teacher  (DELETED as route)
/teacher/attendance                  → /teacher/attendance               (unchanged)
/teacher/workflows                   → /teacher  (DELETED as route, action inline)
/teacher/exports                     → /teacher/exports                  (NEW)

/grade-editor                        → /grade-editor  (TeacherHub)       (REPLACED)
/grade-editor/courses                → /grade-editor  (DELETED as route)
/grade-editor/grades                 → /grade-editor  (DELETED as route)
/grade-editor/grades/:courseId       → /grade-editor  (DELETED as route)
/grade-editor/exports                → /grade-editor/exports             (NEW)

/dean                                → /dean  (DeanDashboard)            (REPLACED)
/dean/workflows                      → /dean  (DELETED as route, absorbed)
/dean/history                        → /dean/history                     (NEW)
/dean/monitoring                     → /dean/monitoring                  (NEW, same component)

/student                             → /student                          (modified, content overhaul)

/auth/login                          → /auth/login                       (modified)
/auth/register                       → /auth/register                    (unchanged)
/auth/forgot                         → /auth/forgot                      (modified)
/auth/reset                          → /auth/reset                       (modified)
/settings                            → /settings                         (unchanged)
```

---

## 10. Implementation Phases

Implement in this order to ensure the application is always functional and deployable at the end of each phase.

### Phase 1 — Foundation (no breaking changes)
**Estimated effort:** 1–2 days

1. Add `warning` and `success` badge variants (`components/ui/badge.tsx`)
2. Create `PageHeader` component
3. Create `StatusStepper` component
4. Create `GradingProgress` component
5. Create `EmptyState` component (replacement for `Empty`)
6. Create `examStatusVariant` utility (`lib/exam-status.ts`)
7. Create `CascadeDeleteDialog` component

No routes change. No pages change. Pure component additions.

---

### Phase 2 — Admin hub pages (additive routing)
**Estimated effort:** 3–4 days

Create all hub pages. Add their routes to `App.tsx`. Do NOT remove old routes yet — both old and new routes coexist.

Order:
1. `InstitutionHub.tsx` at `/admin/institution`  
   *(the existing `/admin/institution` was InstitutionSettings — rename existing route to tab)*
2. `ProgramsHub.tsx` at `/admin/programs`  
   *(the existing `/admin/programs` was ProgramManagement — rename to tab)*
3. `ClassesHub.tsx` at `/admin/classes`
4. `UsersHub.tsx` at `/admin/users`
5. `ExamsHub.tsx` at `/admin/exams`
6. `GradesHub.tsx` at `/admin/grades`  
   *(note: `/admin/grades` is a new route — does not conflict)*
7. `PromotionHub.tsx` at `/admin/promotion`  
   *(note: `/admin/promotion` is a new route — does not conflict)*
8. `ConfigurationHub.tsx` at `/admin/configuration`

Update sidebar `adminGroups` to point to the new hub routes.

---

### Phase 3 — Admin sidebar cleanup
**Estimated effort:** 1 day

Remove old routes from `App.tsx` for all pages absorbed into hubs. The source component files stay — they are still used as tab content.

Test that every old URL either redirects or 404s gracefully (React Router will 404 which is fine at this stage — add redirects for any bookmarked URLs if needed).

---

### Phase 4 — Teacher Hub
**Estimated effort:** 3–4 days

This is the highest complexity page. Build `TeacherHub.tsx`:

1. Course card list with loading state
2. Exam rows with progress bars
3. Per-exam CTA logic (status-driven)
4. Inline grade entry accordion panel (extract table from `GradeEntry.tsx`)
5. Submit action inline
6. Fix N+1 queries with `Promise.all`

Update teacher sidebar. Remove old teacher routes.

---

### Phase 5 — Dean Dashboard
**Estimated effort:** 1–2 days

1. Build `DeanDashboard.tsx` with filtered exam list (`status: submitted`)
2. Add rich context per exam card
3. Add `RejectExamDialog` with reason field
4. Build `ApprovalHistory.tsx`
5. Update dean sidebar

---

### Phase 6 — Student Dashboard overhaul
**Estimated effort:** 2 days

1. Rewrite `PerformanceDashboard.tsx` with full grade breakdown
2. Add semester accordion
3. Add upcoming exams section
4. Test with real student data

---

### Phase 7 — In-place modifications
**Estimated effort:** 2–3 days

Apply all changes from §6.3:
- Admin Dashboard action-needed section
- StudentManagement CSV preview
- DeliberationsList badge colors + default filter
- Auth pages (back link, remember me, success state)
- `CascadeDeleteDialog` on all destructive actions

---

### Phase 8 — Cleanup
**Estimated effort:** 1 day

1. Delete source files for pages that were fully absorbed (WorkflowManager, ExamTypes, ExamScheduler, etc.) — only after confirming no imports remain
2. Remove unused i18n keys (or defer to a separate cleanup pass)
3. Run `bun check-types` — fix any type errors from removed pages
4. Full regression test of all roles

---

## 11. Technical Constraints & Notes

### Imports and tree-shaking
When hub pages import the old page components as tab content, those components are still bundled. This is intentional during the transition. After Phase 8, deleted components stop being imported and are automatically excluded from the bundle.

### URL persistence with `nuqs`
`nuqs` is already in the project (`useQueryState` is used in `Login.tsx` and elsewhere). Use it for all tab state in hub pages. This means tab selection survives page refresh and browser back/forward, which is critical for UX.

```ts
import { useQueryState } from 'nuqs';
const [tab, setTab] = useQueryState('tab', { defaultValue: 'institution' });
```

### React Router and nested routes
The hub pages are **not** nested routes — they are flat routes with internal tab state managed by URL search params. This avoids the complexity of nested `<Outlet>` patterns and keeps each hub page self-contained.

Do not use React Router's `<Route>` nesting for tabs — use shadcn `Tabs` + `useQueryState`.

### Grade editor role
The grade editor role uses the exact same `TeacherHub` component as the teacher role. The difference in data (only delegated courses) is handled server-side by the tRPC query. The frontend simply passes `teacherId: user.id` and the backend filters accordingly.

Route `/grade-editor` renders `<TeacherHub />` with a `basePath="/grade-editor"` prop to ensure internal navigation links resolve correctly.

### Backward compatibility for bookmarked URLs
Old admin routes that are removed should get `<Navigate>` redirects in `App.tsx` for at least one release cycle:

```tsx
// In App.tsx, inside the admin <Route>:
<Route path="faculties" element={<Navigate to="/admin/institution?tab=faculties" replace />} />
<Route path="study-cycles" element={<Navigate to="/admin/institution?tab=cycles" replace />} />
// ... etc for all deleted routes
```

These can be removed in a subsequent cleanup PR.

### Testing scope
After each phase, the following must pass:
- `bun check-types` — zero type errors
- `bun run --filter web test` — all Vitest unit tests green
- Manual smoke test: log in as each role (admin, teacher, dean, student, grade editor) and verify primary flow works end-to-end

No Cypress e2e tests need to be written in this pass unless they already exist for affected pages (`pages/__tests__/examWorkflow.e2e.test.tsx` should still pass).

### i18n additions
Each new component/page will require new translation keys. Add them to both `en/translation.json` and `fr/translation.json` simultaneously. Suggested namespace prefixes:

- Hub page titles: `admin.hubs.<name>.title` / `admin.hubs.<name>.description`
- Teacher hub: `teacher.hub.*`
- Dean dashboard: `dean.dashboard.*`
- New shared components: `components.pageHeader.*`, `components.gradingProgress.*`, etc.

Use `defaultValue` fallbacks during development so the app never shows raw keys.

---

*End of document.*
