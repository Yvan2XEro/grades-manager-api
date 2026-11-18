# Full Application Audit - Grades Manager API

> **Date**: 2026-02-21
> **Branch analyzed**: `frontend-redesign-v2`
> **Goal**: Exhaustive inventory of what exists, identifying inconsistencies, gaps and unclear areas

---

## Table of Contents

1. [Overall Architecture](#1-overall-architecture)
2. [Backend - Infrastructure](#2-backend---infrastructure)
3. [Backend - Modules (Full Inventory)](#3-backend---modules-full-inventory)
4. [Database Schema](#4-database-schema)
5. [Frontend](#5-frontend)
6. [Tests and Coverage](#6-tests-and-coverage)
7. [Seeding System](#7-seeding-system)
8. [Configuration and DevOps](#8-configuration-and-devops)
9. [Identified Inconsistencies](#9-identified-inconsistencies)
10. [Identified Gaps](#10-identified-gaps)
11. [Unclear Areas and Open Questions](#11-unclear-areas-and-open-questions)
12. [Summary](#12-summary)

---

## 1. Overall Architecture

### Tech Stack
- **Runtime**: Bun
- **Backend**: Hono + tRPC + Drizzle ORM
- **Frontend**: React + Vite + TailwindCSS v4 + shadcn/ui
- **Database**: PostgreSQL (PGlite for tests)
- **Authentication**: Better-Auth with plugins (admin, customSession, organization)
- **API**: tRPC (type-safe end-to-end)
- **i18n**: i18next (EN/FR)
- **Global state**: Zustand with localStorage persistence
- **Background jobs**: pg-boss (PostgreSQL)
- **Rules engine**: json-rules-engine

### Monorepo Structure
```
grades-manager-api/
  apps/
    server/     # Backend API (Hono + tRPC + Drizzle)
    web/        # Frontend React (Vite + TailwindCSS + shadcn/ui)
  packages/     # Shared packages (currently empty)
```

---

## 2. Backend - Infrastructure

### 2.1 Entry Point (`apps/server/src/index.ts`)

**What is in place:**
- Hono server with logging, CORS, static files and uploads middleware
- Auth (`/api/auth/**`) and tRPC (`/trpc/*`) routes
- Background jobs startup
- Graceful shutdown (SIGTERM)
- Health check endpoint `/` returning "OK"

**Identified problems:**
- CORS_ORIGINS can be empty (no validation), which disables CORS without warning
- Health check does not verify DB connectivity or job status
- No error handling if `startBackgroundJobs()` fails
- HTTP methods for auth are hardcoded (`POST`, `GET`) - OPTIONS for preflight is not explicit

### 2.2 tRPC Setup (`apps/server/src/lib/trpc.ts`)

**Defined procedure types (10):**
| Procedure | Auth | Tenant | Role |
|-----------|------|--------|------|
| `publicProcedure` | No | No | None |
| `protectedProcedure` | Yes | No | None |
| `adminProcedure` | Yes | No | administrator/dean/super_admin/owner |
| `superAdminProcedure` | Yes | No | super_admin/owner |
| `gradingProcedure` | Yes | No | canGrade=true |
| `tenantProcedure` | No | Yes | None |
| `tenantProtectedProcedure` | Yes | Yes | None |
| `tenantAdminProcedure` | Yes | Yes | Admin+ |
| `tenantSuperAdminProcedure` | Yes | Yes | SuperAdmin+ |
| `tenantGradingProcedure` | Yes | Yes | canGrade=true |

**Problems:**
- `tenantMiddleware` throws `INTERNAL_SERVER_ERROR` when the institution is missing; it should be `PRECONDITION_FAILED`
- No specific procedure for the `teacher` or `dean` roles individually
- Non-tenant procedures (publicProcedure, protectedProcedure) have no tenant isolation

### 2.3 Context Creation (`apps/server/src/lib/context.ts`)

**Flow:**
```
Session Better-Auth
  -> Domain User Profile (via authUserId)
  -> Organization Member (via memberId)
  -> Organization + Institution
  -> Computed permissions
```

**Problems:**
- Auto-creation of the domain user with `lastName: ""` when missing - poor-quality data
- No transaction for context creation (multi-table reads are not atomic)
- Membership resolution fallback potentially inconsistent
- The profile can be null in many procedures without warning

### 2.4 Authentication (`apps/server/src/lib/auth.ts`)

**Configuration:**
- Better-Auth with email/password
- Plugins: admin, customSession, organization
- 7 organization roles: owner, super_admin, administrator, dean, teacher, staff, student
- Cookies: configurable sameSite, configurable secure, httpOnly always true
- Session enriched with domainProfiles and activeMembership on every request

**Problems:**
- `adminRoles = ["admin"]` in Better-Auth vs different domain roles (administrator, super_admin) - confusing
- customSession hook makes DB calls on every request (performance)
- trustedOrigins depends on CORS_ORIGINS - if misconfigured, auth silently breaks
- No validation that `BETTER_AUTH_COOKIE_SECURE=true` in production
- No explicit CSRF protection

### 2.5 Authorization and Roles (`apps/server/src/modules/authz/`)

**Role hierarchy:**
```
owner
  super_admin
    administrator
      dean
        teacher
          staff
            student
```

**Computed permissions (PermissionSnapshot):**
```typescript
{
  canManageCatalog: boolean    // Admin+
  canManageStudents: boolean   // Admin+
  canGrade: boolean            // Teacher+
  canAccessAnalytics: boolean  // Admin+
}
```

**Problems:**
- Roles hardcoded in the code (not in the DB)
- ADMIN_ROLES includes `dean` - debatable depending on the institution
- Only 4 boolean permissions - no fine-grained control
  - No `canEditGrade` distinct from `canGrade`
  - No `canViewStudent` (privacy)
  - No `canManageUsers`, `canManageWorkflows`
- Three unaligned role systems: Better-Auth admin, organization roles, domain roles

### 2.6 Background Jobs (`apps/server/src/lib/jobs.ts`)

**Defined jobs (3):**
| Job | Frequency | Description |
|-----|-----------|-------------|
| `closeExpiredApprovedExams` | 5 min | Closes expired approved exams |
| `sendPending` | 1 min | Sends pending notifications |
| `markStaleJobs` | 5 min | Marks stuck batch jobs |

**Problems:**
- Hardcoded intervals with no way to configure them
- No try/catch in handlers (silent errors)
- Console logging only (not structured/JSON)
- No metrics or monitoring
- Graceful shutdown with a hardcoded 10s timeout
- pg-boss can fail silently at startup

### 2.7 DB Connection (`apps/server/src/db/index.ts`)

**Modes:**
- Test: in-memory PGlite
- Dev: file-based PGlite or PostgreSQL (configurable)
- Prod: PostgreSQL (node-postgres pool)

**Problems:**
- PostgreSQL pool with default config (size 10, no timeout/SSL)
- DATABASE_URL not validated
- No `.on('error')` listener on the pool
- Implicit PGlite/PostgreSQL selection based on the environment

---

## 3. Backend - Modules (Full Inventory)

### 3.1 Institutional Modules

#### institutions
- **Status**: COMPLETE
- **Operations**: create, read (getById, list), update, delete, upsert
- **Auth**: adminProcedure (mutations), protectedProcedure (reads)
- **Validations**: code min 1, type enum, bilingual names required, email/URL format

#### programs
- **Status**: COMPLETE
- **Operations**: create, read (list, getById, getByCode, search), update, delete
- **Auth**: adminProcedure / protectedProcedure
- **Specifics**: Auto-creation of a "Default option" on creation, code normalization, slug generation

#### study-cycles (with cycle-levels)
- **Status**: COMPLETE
- **Cycle CRUD operations**: create, list, get, update, delete
- **Level CRUD operations**: create, list, get, update, delete
- **Specifics**: Auto-generation of levels based on durationYears, equal distribution of credits

#### program-options
- **Status**: COMPLETE
- **Operations**: Standard CRUD

### 3.2 Academic Structure Modules

#### academic-years
- **Status**: COMPLETE
- **Operations**: create, getById, list, update, delete + `setActive` (superAdmin)
- **Specifics**: setActive deactivates the other years in a transaction (singleton)

#### semesters
- **Status**: INCOMPLETE - Read-only
- **Operations**: `listSemesters` only
- **Missing**: CREATE, UPDATE, DELETE

#### teaching-units
- **Status**: COMPLETE
- **Operations**: create, getById, list, update, delete
- **Validations**: Checks that the program exists before creation

#### courses
- **Status**: COMPLETE
- **Operations**: create, getById, getByCode, list, search, update, delete + assignDefaultTeacher
- **Validations**: Code/name required, hours > 0

#### classes
- **Status**: COMPLETE
- **Operations**: create, getById, getByCode, list, search, update, delete + transferStudent
- **Auth**: tenantAdminProcedure / tenantProtectedProcedure
- **Specifics**: Auto-creation of default cycle/level/option/semester when missing, atomic student transfer in a transaction

#### class-courses
- **Status**: COMPLETE
- **Operations**: create, getById, getByCode, list, search, update, delete + roster
- **Specifics**: Role-based filtering (admins: everything, teachers: their own + delegated), delegation with audit, isDelegated flag

### 3.3 Student and Enrollment Modules

#### students
- **Status**: COMPLETE
- **Operations**: create, admitExternal, getById, list, update + bulkCreateStudents
- **Specifics**: External admission with transferred credits, bulk import

#### enrollments
- **Status**: COMPLETE
- **Operations**: create, getById, list, update + updateStatus
- **Statuses**: pending, active, completed, withdrawn

#### student-course-enrollments
- **Status**: COMPLETE
- **Operations**: Bulk enrollment, auto-enrollment by class, enrollment closing
- **Statuses**: planned, active, completed, failed, withdrawn

#### domain-users
- **Status**: INCOMPLETE
- **Files**: Only the repo (domain-users.repo.ts)
- **Missing**: Router, service, Zod schemas - used internally only

### 3.4 Exam and Grade Modules

#### exams
- **Status**: COMPLETE (advanced)
- **Operations**: create, getById, list, update, delete + submit, validate, lock
- **Auth**: tenantGradingProcedure (create/update/submit), tenantAdminProcedure (delete/validate/lock)
- **Status workflow**: draft -> scheduled -> submitted -> approved/rejected
- **Specifics**: Percentage validation (sum <= 100 per classCourse), retake system (parentExamId, sessionType), retake eligibility override

#### grades
- **Status**: COMPLETE (advanced)
- **Operations**: upsertNote, listByExam, listByStudent, listByClassCourse, updateNote, deleteNote
- **Analytics**: avgForExam, avgForCourse, avgForStudentInCourse
- **Import/Export**: importCsv, exportClassCourseCsv, consolidatedByStudent (transcript)
- **Specifics**: Delegation with audit logging, automatic recomputation of the credit ledger, transcript with weighted averages

#### exam-grade-editors
- **Status**: COMPLETE
- **Operations**: assignEditor, listEditors, revokeEditor
- **Specifics**: Management of grading delegation (teachers assign delegates)

#### exam-types
- **Status**: COMPLETE
- **Operations**: Standard CRUD

#### exam-scheduler
- **Status**: COMPLETE
- **Operations**: preview, schedule, previewRetakes, scheduleRetakes, history, details
- **Specifics**: Bulk scheduling with audit trail (examScheduleRuns)

### 3.5 Workflow and Business Rule Modules

#### workflows
- **Status**: PARTIAL
- **Operations**: validateGrades, toggleEnrollmentWindow, listEnrollmentWindows, triggerAttendanceAlert
- **Missing**: Full multi-level validation workflow, approval history

#### promotion-rules
- **Status**: COMPLETE
- **Operations**: Rule CRUD + evaluation + execution
- **Specifics**: json-rules-engine integration, student facts service, pre-configured example rules

#### promotions
- **Status**: COMPLETE
- **Operations**: evaluateStudentPromotion, listDefaultRules
- **Specifics**: Combines credit ledger + rules engine

#### rules-engine
- **Status**: COMPLETE
- **Operations**: JSON rule evaluation, default rules
- **Dependency**: json-rules-engine v7.3.1

#### student-credit-ledger
- **Status**: COMPLETE
- **Operations**: summarizeStudent, recomputeForStudent + compute-ue-credits
- **Specifics**: Tracking of attempted/earned/in-progress credits, teaching unit (UE) validation

### 3.6 Administrative Modules

#### users
- **Status**: COMPLETE
- **Operations**: create, list, update, delete
- **Filters**: By role, status

#### notifications
- **Status**: COMPLETE (structure)
- **Operations**: Router, service, repo, zod

#### batch-jobs
- **Status**: COMPLETE
- **Operations**: preview, run, cancel, rollback, get, list
- **Job types**: credit-ledger-recompute, student-facts-refresh
- **Specifics**: Registry pattern, preview before execution, rollback support

#### registration-numbers
- **Status**: COMPLETE
- **Operations**: Format CRUD + automatic generation
- **Specifics**: Configurable formats with partitioned counters

#### exports
- **Status**: COMPLETE
- **Operations**: Export with templates (CSV, PDF)

#### export-templates
- **Status**: COMPLETE
- **Operations**: Handlebars template CRUD

#### files
- **Status**: INCOMPLETE
- **Files**: Router only
- **Missing**: Service, repo

### 3.7 Shared Utilities (`_shared/`)
- `auth-guards.ts` - Authentication helpers
- `db-transaction.ts` - Transaction wrapper
- `errors.ts` - Error factories (notFound, conflict)
- `pagination.ts` - Cursor-based pagination

---

## 4. Database Schema

### 4.1 Table Inventory (40+ tables)

#### Authentication Tables (7)
| Table | Key columns | FK |
|-------|---------------|-----|
| `user` | id, name, email, role, banned | - |
| `session` | id, token, userId, activeOrganizationId | user |
| `account` | id, accountId, providerId, userId | user |
| `verification` | id, identifier, value, expiresAt | - |
| `organization` | id, name, slug, logo | - |
| `member` | id, organizationId, userId, role | organization, user |
| `invitation` | id, organizationId, email, status, inviterId | organization, user |

#### Domain Tables (33+)
| Table | Description | Main FKs |
|-------|-------------|----------------|
| `institutions` | Institutions (self-referencing hierarchy) | parentInstitution, organization |
| `domainUsers` | Business profiles | user, member |
| `academicYears` | Academic years | institution |
| `studyCycles` | Study cycles (BTS, Licence...) | institution |
| `cycleLevels` | Levels within a cycle (L1, L2...) | studyCycle |
| `semesters` | Semesters (global catalog) | - |
| `programs` | Programs | institution |
| `programOptions` | Options within a program | program, institution |
| `teachingUnits` | Teaching units | program |
| `courses` | Courses | program, teachingUnit, defaultTeacher |
| `classes` | Classes/cohorts | institution, program, academicYear, cycleLevel, programOption |
| `classCourses` | Course-class-teacher assignment | class, course, teacher, institution |
| `examTypes` | Exam types (CC, TP...) | institution |
| `exams` | Exams | institution, classCourse, parentExam |
| `examScheduleRuns` | Bulk scheduling audit | institution, academicYear, examType |
| `students` | Students | institution, domainUser, class |
| `enrollments` | Student-class-year enrollments | institution, student, class, academicYear |
| `studentCourseEnrollments` | Course attempts | student, classCourse, course, sourceClass, academicYear |
| `studentCreditLedgers` | Aggregated credit tracking | student, academicYear |
| `enrollmentWindows` | Enrollment periods | class, academicYear |
| `grades` | Exam grades | student, exam |
| `coursePrerequisites` | Prerequisites between courses | course (x2) |
| `promotionRules` | Promotion rules (json-rules) | institution, sourceClass, program, cycleLevel |
| `promotionExecutions` | Promotion executions | rule, sourceClass, targetClass, academicYear, executedBy |
| `promotionExecutionResults` | Per-student results | execution, student |
| `studentPromotionSummaries` | Promotion summaries (cache) | student, academicYear, class, program |
| `examGradeEditors` | Grading delegates | exam, editor, grantedBy |
| `gradeEditLogs` | Grade change audit | institution, exam, classCourse, student, grade, actor |
| `classCourseAccessLogs` | Delegated access audit | institution, classCourse, actor |
| `notifications` | Workflow notifications | recipient |
| `registrationNumberFormats` | Registration number formats | institution |
| `registrationNumberCounters` | Registration number counters | format |
| `exportTemplates` | Export templates | institution, createdBy, updatedBy |
| `retakeOverrides` | Retake eligibility override | institution, exam, studentCourseEnrollment |
| `batchJobs` | Bulk jobs | institution, createdBy |
| `batchJobSteps` | Batch steps | job |
| `batchJobLogs` | Batch logs | job, step |

### 4.2 Defined Enums
| Enum | Values |
|------|---------|
| BusinessRole | super_admin, administrator, dean, teacher, staff, student |
| Gender | male, female, other |
| DomainUserStatus | active, inactive, suspended |
| TeachingUnitSemester | fall, spring, annual |
| EnrollmentStatus | pending, active, completed, withdrawn |
| EnrollmentWindowStatus | open, closed |
| StudentCourseEnrollmentStatus | planned, active, completed, failed, withdrawn |
| NotificationChannel | email, webhook |
| NotificationStatus | pending, sent, failed |
| ExamSessionType | normal, retake |
| RetakeScoringPolicy | replace, best_of |
| AdmissionType | normal, transfer, direct, equivalence |
| CoursePrerequisiteType | mandatory, recommended |
| InstitutionType | university, institution, faculty |
| ExportTemplateType | pv, evaluation, ue |
| GradeEditLogAction | write, delete, import |
| GradeEditActorRole | admin, teacher, delegate |
| BatchJobStatus | pending, previewed, running, completed, failed, cancelled, stale, rolled_back |
| BatchJobStepStatus | pending, running, completed, failed, skipped |
| BatchJobLogLevel | info, warn, error |

### 4.3 JSONB Fields (flexible schema)
| Table | Field | Content |
|-------|-------|---------|
| institutions | metadata | export_config, signatures, exam_settings, watermark |
| enrollments | admissionMetadata | Free-form admission data |
| notifications | payload | Variable content |
| promotionRules | ruleset | json-rules-engine format |
| promotionExecutionResults | evaluationData, rulesMatched | Evaluation results |
| promotionExecutions | metadata | Execution metadata |
| registrationNumberFormats | definition | RegistrationNumberFormatDefinition |
| studentPromotionSummaries | averagesByTeachingUnit, averagesByCourse, facts | Detailed averages |
| batchJobs | params, previewResult, executionResult, progress, suggestedActions | Job data |
| batchJobSteps | data | Step data |
| batchJobLogs | data | Log data |
| gradeEditLogs | metadata | Edit metadata |
| examScheduleRuns | classIds | Class IDs |

---

## 5. Frontend

### 5.1 Defined Routes

#### Auth (Public - 4 routes)
- `/auth/login`, `/auth/register`, `/auth/forgot`, `/auth/reset`

#### Admin (Protected - 34 pages)
- `/admin` - Dashboard
- `/admin/institution` - Institution settings
- `/admin/academic-years` - Academic years
- `/admin/faculties` - Faculties
- `/admin/study-cycles` - Study cycles
- `/admin/programs` - Programs
- `/admin/teaching-units` - Teaching units
- `/admin/teaching-units/:teachingUnitId` - Teaching unit detail
- `/admin/classes` - Classes
- `/admin/courses` - Courses
- `/admin/class-courses` - Course-class assignments
- `/admin/enrollments` - Enrollments
- `/admin/users` - Users
- `/admin/students` - Students
- `/admin/exams` - Exams
- `/admin/exam-types` - Exam types
- `/admin/exam-scheduler` - Exam scheduler
- `/admin/retake-eligibility` - Retake eligibility
- `/admin/grade-export` - Grade export
- `/admin/export-templates` - Export templates
- `/admin/export-templates/:templateId` - Template editor
- `/admin/promotion-rules` - Promotion rules dashboard
- `/admin/promotion-rules/rules` - Rule list
- `/admin/promotion-rules/evaluate` - Evaluation
- `/admin/promotion-rules/execute` - Execution
- `/admin/promotion-rules/history` - History
- `/admin/rules` - Rule management
- `/admin/registration-numbers` - Registration number formats
- `/admin/registration-numbers/:formatId` - Format detail
- `/admin/monitoring` - Monitoring
- `/admin/notifications` - Notification center
- `/admin/batch-jobs` - Batch jobs dashboard
- `/admin/batch-jobs/:jobId` - Batch job detail

#### Teacher (Protected - 6 pages)
- `/teacher` - Dashboard
- `/teacher/courses` - Course list
- `/teacher/grades` - Grade entry
- `/teacher/grades/:courseId` - Grades for a course
- `/teacher/attendance` - Attendance alerts
- `/teacher/workflows` - Workflow manager

#### Dean (Protected - 2 pages)
- `/dean` - Monitoring
- `/dean/workflows` - Approvals

#### Student (Protected - 1 page)
- `/student` - Performance dashboard

### 5.2 Global State (Zustand)
```typescript
Store:
  user: { profileId, authUserId, email, role, firstName, lastName, permissions, domainProfiles }
  sidebarOpen: boolean
  activeOrganizationSlug: string | null
Persistence: localStorage (key: "academic-management-store")
```

### 5.3 i18n
- 2 languages: EN (~2928 lines), FR (~2919 lines)
- Near-complete parity between the two files
- Sections: common, navigation, auth, teacher, admin, dean, student, components

### 5.4 Components
- **Layouts**: AuthLayout, DashboardLayout
- **Navigation**: Header (breadcrumbs, language, notifications, profile), Sidebar (role-based menu), Redirector
- **Modals**: FormModal, ConfirmModal
- **Inputs**: AcademicYearSelect, ClassSelect, SemesterSelect, DebouncedSearchField
- **Forms**: coded-entity-select (generic select)
- **UI**: 60+ shadcn/ui components

### 5.5 Frontend-Backend Alignment
All backend routers are used on the frontend. No missing endpoint detected.

---

## 6. Tests and Coverage

### 6.1 Test Infrastructure
- **Runner**: Bun test (native)
- **Test DB**: in-memory PGlite
- **Utilities**: `test-utils.ts` with factories (makeTestContext, asAdmin, asSuperAdmin, createRecapFixture, etc.)
- **Pattern**: `appRouter.createCaller(context)` for integration tests

### 6.2 Modules WITH Tests (22)
academic-years, batch-jobs, class-courses, classes, courses, enrollments, exam-grade-editors, exam-scheduler, exam-types, exams, exports, grades, institutions, programs, promotion-rules, registration-numbers, semesters, student-course-enrollments, students, study-cycles, teaching-units, users

### 6.3 Modules WITHOUT Tests (12)
authz, domain-users, export-templates, files, notifications, program-options, promotions, rules-engine, student-credit-ledger, workflows, _shared

### 6.4 Frontend Tests
**NO FRONTEND TESTS** - Vitest and Cypress are configured in package.json but no test file exists.

### 6.5 HTTP Tests
- `routers/__tests__/workflows.http.test.ts` - Workflow HTTP tests
- `routers/__tests__/e2e.http.test.ts` - E2E HTTP tests

---

## 7. Seeding System

### 7.1 3-Layer Architecture
1. **Foundation** (`00-foundation.yaml`) - Organizations, exam types, institutions, cycles, semesters, years
2. **Academics** (`10-academics.yaml`) - Programs, teaching units, courses, classes, class-courses, exams
3. **Users** (`20-users.yaml`) - Auth users, domain users, students, enrollments

### 7.2 Sample Data (INSES)
- 1 organization
- Several cycles (BTS, Licence, Master, CQP)
- 7+ programs
- 30+ teaching units
- 10+ courses
- 3 classes
- 7 users (admin, 4 teachers, 2 students)
- 2 students with enrollments
- 2 exams in draft

### 7.3 Scaffold System
`seed/sample-data.ts` (1074 lines) generates the YAML templates in `seed/local/`

---

## 8. Configuration and DevOps

### 8.1 Environment Variables
```
CORS_ORIGINS          # CORS origins
BETTER_AUTH_SECRET    # Auth secret
BETTER_AUTH_URL       # Auth base URL
DATABASE_URL          # PostgreSQL connection
STORAGE_DRIVER        # local, s3
BETTER_AUTH_COOKIE_SECURE  # true/false
BETTER_AUTH_COOKIE_SAMESITE  # none, lax, strict
STORAGE_LOCAL_ROOT    # Uploads path
SERVER_PUBLIC_URL     # Public server URL
```

### 8.2 Available Scripts
| Script | Description |
|--------|-------------|
| `bun dev` | Run everything in dev |
| `bun dev:server` | Backend only |
| `bun dev:web` | Frontend only |
| `bun check` | Biome format + lint |
| `bun check-types` | TypeScript check |
| `bun db:push` | Push schema |
| `bun db:studio` | Drizzle Studio |
| `bun db:generate` | Generate migrations |
| `bun db:migrate` | Run migrations |
| `bun test` | Backend tests |
| `bun build` | Build everything |

### 8.3 CI/CD
**NO CI/CD PIPELINE CONFIGURED** - No GitHub Actions, no automated workflow.

---

## 9. Identified Inconsistencies

### INC-01: Triple unaligned role system
- **Better-Auth**: `adminRoles = ["admin"]`
- **Organization roles**: owner, super_admin, administrator, dean, teacher, staff, student
- **Domain roles (authz)**: super_admin, administrator, dean, teacher, staff, student

The Better-Auth `"admin"` role does not match any domain role. The `"owner"` role exists in the organization but not in the domain roles.

### INC-02: Inconsistent FK naming in the schema
Some FKs follow the `xxxId` convention, others do not:
| Correct convention | Broken convention |
|---------------------|-------------------|
| `teachingUnitId` | `courses.program` (instead of `programId`) |
| `semesterId` | `courses.defaultTeacher` (instead of `defaultTeacherId`) |
| `cycleLevelId` | `classes.program` (instead of `programId`) |
| `classCourseId` | `classes.academicYear` (instead of `academicYearId`) |
| | `grades.student` (instead of `studentId`) |
| | `grades.exam` (instead of `examId`) |
| | `exams.classCourse` (instead of `classCourseId`) |
| | `classCourses.class` (instead of `classId`) |
| | `classCourses.course` (instead of `courseId`) |
| | `classCourses.teacher` (instead of `teacherId`) |

### INC-03: Inconsistent procedures across modules
- The `classes`, `class-courses`, `exams`, `grades` modules use the `tenant*` procedures
- The `institutions`, `programs`, `courses`, `academic-years` modules use the global procedures (`adminProcedure`, `protectedProcedure`)
- No clear logic on when to use tenant vs global

### INC-04: Heterogeneous error handling
- Some modules use `TRPCError` directly
- Others use the `notFound()` and `conflict()` helpers from `_shared/errors.ts`
- No uniform standard

### INC-05: ADMIN_ROLES includes "dean"
```typescript
const ADMIN_ROLES = ["administrator", "dean", "super_admin", "owner"]
```
The `dean` is treated as an admin, which may not match every institution. This is a hardcoded business policy.

### INC-06: Enums without DB constraints
"Status" fields are `text` columns without a CHECK constraint in the database. Invalid values can be inserted directly into the DB.

### INC-07: Blanket cascading deletes without soft delete
All FKs use `ON DELETE CASCADE`. Deleting an institution cascades to ALL programs, classes, students, grades, etc. No soft delete mechanism.

### INC-08: academicYearId redundancy
- `classes.academicYear` links a class to a year
- `enrollments.academicYearId` links an enrollment to a year
- If a student is enrolled in a class for year X, the enrollment should match. But nothing prevents an enrollment with a year Y different from the class's year.

### INC-09: tenantMiddleware error code
The `tenantMiddleware` throws `INTERNAL_SERVER_ERROR` when the institution is missing from the context. This is a client precondition error, not a server error. It should be `PRECONDITION_FAILED` or `BAD_REQUEST`.

### INC-10: No "/staff" route in the frontend
The `staff` role exists in the role system but no frontend route is defined for it. The sidebar shows nothing for a `staff` user.

### INC-11: MonitoringDashboard with hardcoded data
The `MonitoringDashboard.tsx` page displays fixed metrics (3 grade windows, 5 pending alerts) instead of real data.

### INC-12: Identical procedure for different roles
In `organization-roles.ts`, dean, teacher, staff and student have exactly the same Better-Auth permissions (`memberAc`). Differentiation happens only at the domain level, making the Better-Auth role system useless for these roles.

### INC-13: `@ts-nocheck` in TeachingUnitCoursesTable
The `TeachingUnitCoursesTable.tsx` file has a `@ts-nocheck` directive that disables TypeScript type-checking, potentially hiding errors.

### INC-14: Scores without range constraint in grades
The `grades` table uses `numeric(5,2)` without a CHECK constraint on the range. In theory, a grade of 999.99 or -100.00 could be inserted.

---

## 10. Identified Gaps

### MNQ-01: No frontend tests
Despite Vitest and Cypress being configured in `package.json`, there is no frontend test file. Zero coverage.

### MNQ-02: 12 backend modules without tests
authz, domain-users, export-templates, files, notifications, program-options, promotions, rules-engine, student-credit-ledger, workflows, _shared - no tests.

### MNQ-03: No CI/CD
No GitHub Actions pipeline or equivalent. Tests, linting and builds are not automated.

### MNQ-04: Incomplete semesters module
The `semesters` module is read-only. No CREATE, UPDATE, DELETE. Semesters can only be managed through the seed.

### MNQ-05: Incomplete domain-users module
Only the `repo` file exists. No router, service or Zod schemas. The module is used internally only.

### MNQ-06: Incomplete files module
Only the router exists. No service or repo.

### MNQ-07: No soft delete
No table has a `deletedAt` column. Deletions are permanent and irreversible. No trash, no recovery.

### MNQ-08: No optimistic locking
No table has a `version` or `rowVersion` field. Risk of race conditions on concurrent updates of grades, enrollments, etc.

### MNQ-09: Overly coarse permissions
Only 4 boolean permissions (canManageCatalog, canManageStudents, canGrade, canAccessAnalytics). Missing:
- `canEditGrade` (distinct from `canGrade`)
- `canViewStudentData` (privacy)
- `canManageUsers`
- `canManageWorkflows`
- `canExportData`
- `canManageExamSchedule`

### MNQ-10: No validation of JSONB fields
17 JSONB fields in the schema with no structural validation in the database. Validation happens only on the application side.

### MNQ-11: Missing database indexes
Critical indexes missing:
- `domainUsers.status`, `domainUsers.primaryEmail`
- `enrollments` composite `(student, academicYear)`, index on `status`
- `studentCourseEnrollments` composite `(student, academicYear)`, index on `status`
- `exams.status`
- `classes` composite `(institution, program)`
- `courses` composite `(program, teachingUnit)`
- `institutions.type`

### MNQ-12: No range constraint on scores
The `grades` table allows any numeric(5,2) value. No CHECK score >= 0 AND score <= 20 (or 100).

### MNQ-13: No prevention of circular prerequisites
The `coursePrerequisites` table does not prevent cycles: A requires B, B requires A. There is also no constraint preventing A -> A.

### MNQ-14: No "updatedBy" audit on the main tables
Tables such as `institutions`, `programs`, `courses` have `updatedAt` but no `updatedBy`. Impossible to know who made a change.

### MNQ-15: No frontend page for exam-grade-editors
The grading delegation system exists in the backend but has no dedicated frontend interface.

### MNQ-16: No frontend page for program-options and cycle-levels
These entities are selected in dropdowns but have no dedicated CRUD pages.

### MNQ-17: No real monitoring
The `MonitoringDashboard` is a placeholder with hardcoded data. No real health check, no system metrics.

### MNQ-18: No "staff" page
The `staff` role has no dedicated frontend view. A staff user would be redirected nowhere.

### MNQ-19: No global error handling on the frontend
No React Error Boundary observed. Unhandled errors can cause a blank-screen crash.

### MNQ-20: PostgreSQL pool not configured
DB connection with default config (pool size 10, no timeout, no SSL). Insufficient for multi-tenant in production.

### MNQ-21: No seed data for grades
The sample dataset contains no grades. Exams are in `draft` status, no seeded grades.

### MNQ-22: No multi-institution scenario in the seed
The seed contains only one institution. No real multi-tenant testing.

### MNQ-23: No creditsEarned <= creditsAttempted constraint
The `studentCourseEnrollments` and `studentCreditLedgers` tables do not check that earned credits do not exceed attempted credits.

### MNQ-24: No exam duration in the schema
The `exams` table has no `duration` field (in minutes), nor `room` or `location`.

### MNQ-25: No class capacity
The `classes` table has no `capacity` field to limit enrollments.

### MNQ-26: No payment status
No table handles tuition fees or student payment status.

### MNQ-27: AttendanceAlerts is a placeholder
The teacher's `AttendanceAlerts.tsx` page is an incomplete placeholder.

---

## 11. Unclear Areas and Open Questions

### ZO-01: Organization <-> Institution relationship
The relationship between Better-Auth `organizations` and domain `institutions` is not obvious. Can an organization have several institutions? The code seems to assume a 1:1 mapping (via `institutions.organizationId`), but the structure allows 1:N.

### ZO-02: "owner" role - when is it assigned?
The `owner` role exists in the hierarchy but is never mentioned in the user interfaces or in the creation flows. How does a user obtain this role?

### ZO-03: Auto-creation of domainUsers
When an authenticated user has no domain user, a profile is auto-created with `lastName: ""`. What is the strategy for completing this profile afterwards? No visible flow.

### ZO-04: Grade validation workflow - full flow
The workflow is: draft -> scheduled -> submitted -> approved/rejected. But who approves? The dean? The admin? How is the notification sent? The end-to-end flow is not clearly documented.

### ZO-05: Multi-tenant - data isolation
The `tenant*` procedures inject `institutionId` into the context. But the non-tenant procedures (`adminProcedure`) do not isolate data by institution. Which procedures are meant to be multi-tenant and which are global?

### ZO-06: Retake system - configurable policy?
The retake system (exam retakes) uses a `passingGrade` and overrides. But where does the default `passingGrade` come from? Is it configurable per institution? A TODO comment mentions "centralize academic policy resolution".

### ZO-07: Credit computation - when is it triggered?
Credit recomputation (`recomputeForStudent`) is called after grade changes. But is it automatic in every case? The `credit-ledger-recompute` and `student-facts-refresh` batch jobs suggest it sometimes has to be run manually.

### ZO-08: Registration numbers - format vs generation
The `registrationNumberFormats` system is configurable (templates with segments). But how is generation done? When the student is created? Automatically or manually?

### ZO-09: Notifications - which events trigger what?
The `notifications` module exists, but which events trigger which notifications? The only references are in the `sendPending` job and the `triggerAttendanceAlert` workflow. The other triggers are unclear.

### ZO-10: Export templates - Handlebars
Export templates use Handlebars. What is the surface of variables available in each template type (pv, evaluation, ue)? No documentation of the helpers.

### ZO-11: Semesters vs TeachingUnit.semester
The `semesters` table defines a global catalog (S1, S2...), but `teachingUnits.semester` uses an enum (fall, spring, annual). How do these two concepts relate?

### ZO-12: Class auto-creation defaults
The `classes` service auto-creates default cycles, levels, options and semesters if they are missing. This means creating a class can have unexpected side effects. What is the strategy?

### ZO-13: StudentPromotionSummaries - cache or source of truth?
The `studentPromotionSummaries` table contains 48 columns of computed data. Is it a cache recomputed by a batch job or the source of truth for promotion decisions?

### ZO-14: Batch jobs - duplicate prevention
Two batch job types exist: `credit-ledger-recompute` and `student-facts-refresh`. Nothing seems to prevent running the same job in parallel.

### ZO-15: PGlite in dev - behavioral differences
The code uses PGlite in dev/test and PostgreSQL in prod. PGlite does not support every PostgreSQL feature (extensions, pg-boss). Jobs are disabled under PGlite. What other behavioral differences exist?

---

## 12. Summary

### What works well
- Clear and consistent modular architecture (module pattern)
- End-to-end type safety with tRPC
- Advanced exam management system (workflow, retakes, delegation)
- Credit ledger with automatic recomputation
- Configurable promotion rules engine (json-rules-engine)
- Audit logging for sensitive operations (grades, access)
- Complete EN/FR i18n
- Layered, structured seed system
- Complete batch jobs framework

### Key Figures
| Metric | Value |
|----------|--------|
| Database tables | 40+ |
| Backend modules | 33+ |
| Complete modules | 31 (94%) |
| Modules with tests | 22 (67%) |
| Modules without tests | 12 (33%) |
| Frontend pages | 47 |
| Frontend tests | 0 |
| Inconsistencies | 14 |
| Gaps | 27 |
| Unclear areas | 15 |
| CI/CD pipeline | 0 |

### Suggested Priorities (not corrective, indicative only)

**Critical:**
- INC-07 (cascading deletes without soft delete)
- MNQ-01 (zero frontend tests)
- MNQ-03 (no CI/CD)
- MNQ-11 (missing indexes)
- MNQ-20 (DB pool not configured)

**Important:**
- INC-01 (triple role system)
- INC-02 (inconsistent FK naming)
- INC-03 (tenant vs global procedures)
- MNQ-08 (no optimistic locking)
- MNQ-09 (overly coarse permissions)

**Improvement:**
- INC-06 (enums without constraints)
- MNQ-04 (incomplete semesters)
- MNQ-14 (no updatedBy audit)
- MNQ-21/22 (incomplete seed)
- ZO-04 (document grade workflow)
