# Critical Features to Test with Cypress

This document lists the critical features of the grades management system that must be covered by Cypress E2E tests.

## Priority 1 - Core Features (Must Have)

### 1. Authentication and Authorization
**Module**: `auth`
**Files involved**: `apps/web/src/pages/auth/`

#### Tests to implement:
- [ ] **Administrator login**
  - Successful login with valid credentials
  - Redirect to the admin dashboard after login
  - Error message with invalid credentials
  - Session persists after a page refresh

- [ ] **Teacher login**
  - Successful login
  - Redirect to the teacher dashboard
  - Access only to authorized features

- [ ] **Student login**
  - Successful login
  - Access only to the student dashboard
  - No access to admin/teacher pages

- [ ] **Logout**
  - Logout works correctly
  - Redirect to the login page
  - Session invalidated

### 2. Grade Management (Grade Entry)
**Module**: `grades`, `exams`
**Files involved**: `apps/web/src/pages/teacher/GradeEntry.tsx`

#### Tests to implement:
- [ ] **Grade entry by the teacher**
  - Selecting a course and an exam
  - Entering grades for several students
  - Grade validation (0-20)
  - Grades saved successfully
  - Confirmation message

- [ ] **Editing existing grades**
  - Loading existing grades
  - Editing a grade
  - Saving the change
  - Verifying the update

- [ ] **Grade locking**
  - Grades locked after final validation
  - Locked grades cannot be edited
  - Appropriate information message

### 3. Student Management
**Module**: `students`
**Files involved**: `apps/web/src/pages/admin/StudentManagement.tsx`

#### Tests to implement:
- [ ] **Student creation**
  - Filling in the full form
  - Selecting a class
  - Automatic generation of the registration number
  - Verifying the student appears in the list

- [ ] **Bulk student import**
  - Uploading a valid CSV/Excel file
  - Processing and creating several students
  - Success/error report
  - Duplicate handling

- [ ] **Student editing**
  - Editing personal information
  - Changing class
  - Saving the changes

- [ ] **Search and filtering**
  - Search by name
  - Search by registration number
  - Filtering by class
  - Correct results displayed

### 4. Enrollment Management (Enrollments)
**Module**: `enrollments`
**Files involved**: `apps/web/src/pages/admin/EnrollmentManagement.tsx`

#### Tests to implement:
- [ ] **Individual enrollment**
  - Selecting a student
  - Selecting a class
  - Selecting an academic year
  - Creating the enrollment
  - Status "active"

- [ ] **Bulk enrollment of a class**
  - Selecting an entire class
  - Automatic enrollment of all students
  - Verifying the number of enrollments created
  - Conflict handling (already enrolled)

- [ ] **Enrollment closure**
  - Status change to "completed"
  - History preserved
  - A closed enrollment cannot be edited

### 5. Exam Management
**Module**: `exams`, `exam-scheduler`
**Files involved**:
- `apps/web/src/pages/admin/ExamManagement.tsx`
- `apps/web/src/pages/admin/ExamScheduler.tsx`

#### Tests to implement:
- [ ] **Manual exam creation**
  - Selecting a course
  - Selecting an exam type
  - Setting the date
  - Setting the coefficient
  - Successful creation

- [ ] **Automatic exam scheduling**
  - Configuring the scheduling parameters
  - Selecting multiple classes
  - Starting the generation
  - Verifying the exams were created
  - Scheduling report

- [ ] **Schedule conflict handling**
  - Detection of date conflicts
  - Appropriate warning message
  - Conflict resolution

## Priority 2 - Important Business Features

### 6. Promotion Rules
**Module**: `promotion-rules`
**Files involved**: `apps/web/src/pages/admin/promotion-rules/`

#### Tests to implement:
- [ ] **Promotion rule creation**
  - Filling in the form
  - Defining a valid rule JSON
  - Activating the rule
  - Verifying it in the list

- [ ] **Student evaluation**
  - Selecting a rule
  - Selecting a source class
  - Starting the evaluation
  - Viewing eligible/ineligible students
  - Verifying the criteria (average, credits, etc.)

- [ ] **Promotion execution**
  - Selecting eligible students
  - Selecting the target class
  - Confirming the operation
  - Verifying the class change
  - Execution history created

- [ ] **Viewing the history**
  - List of past executions
  - Details of an execution
  - Statistics (success rate, etc.)

### 7. Registration Numbers
**Module**: `registration-numbers`
**Files involved**:
- `apps/web/src/pages/admin/RegistrationNumberFormats.tsx`
- `apps/web/src/pages/admin/RegistrationNumberFormatDetail.tsx`

#### Tests to implement:
- [ ] **Format creation**
  - Defining segments (literal, counter, field)
  - Format preview
  - Activating the format
  - Automatic deactivation of the other formats

- [ ] **Automatic generation**
  - Creating a student without a manual number
  - Verifying automatic generation
  - Correct counter increment
  - Uniqueness of generated numbers

### 8. Grade Export
**Module**: `grades`
**Files involved**: `apps/web/src/pages/admin/GradeExport.tsx`

#### Tests to implement:
- [ ] **Excel export per class**
  - Selecting a class
  - Selecting specific exams
  - Downloading the Excel file
  - Verifying the content (names, grades, averages)

- [ ] **Official minutes (procès-verbal) export**
  - Generating the PV for a class
  - All grades included
  - Correct average calculations
  - Successful download

### 9. Class Management
**Module**: `classes`
**Files involved**: `apps/web/src/pages/admin/ClassManagement.tsx`

#### Tests to implement:
- [ ] **Class creation**
  - Selecting a program
  - Selecting a cycle level
  - Selecting an option
  - Setting the code and name
  - Successful creation

- [ ] **Assigning courses to a class**
  - Selecting a class
  - Adding multiple courses
  - Setting the weekly hours
  - Assigning teachers
  - Verifying the assignments

## Priority 3 - Workflows and Notifications

### 10. Approval Workflows
**Module**: `workflows`
**Files involved**:
- `apps/web/src/pages/teacher/WorkflowManager.tsx`
- `apps/web/src/pages/dean/WorkflowApprovals.tsx`

#### Tests to implement:
- [ ] **Creating an approval request (teacher)**
  - Submitting a grade change request
  - Status "pending"
  - Notification to the dean

- [ ] **Approval/Rejection (dean)**
  - Viewing pending requests
  - Approving a request
  - Automatic application of the change
  - Notification to the teacher

### 11. Notifications
**Module**: `notifications`
**Files involved**: `apps/web/src/pages/admin/NotificationsCenter.tsx`

#### Tests to implement:
- [ ] **Receiving notifications**
  - Creating a triggering event
  - Notification appears in the center
  - Counter badge updated

- [ ] **Marking as read**
  - Clicking a notification
  - Notification marked as read
  - Badge updated

## Test Structure

### Recommended organization:
```
apps/web/cypress/e2e/
├── auth/
│   ├── login.cy.ts
│   └── logout.cy.ts
├── grades/
│   ├── grade-entry.cy.ts
│   ├── grade-modification.cy.ts
│   └── grade-export.cy.ts
├── students/
│   ├── student-creation.cy.ts
│   ├── student-bulk-import.cy.ts
│   └── student-search.cy.ts
├── enrollments/
│   ├── individual-enrollment.cy.ts
│   ├── bulk-enrollment.cy.ts
│   └── enrollment-closure.cy.ts
├── exams/
│   ├── exam-creation.cy.ts
│   ├── exam-scheduling.cy.ts
│   └── exam-conflicts.cy.ts
├── promotion-rules/
│   ├── rule-creation.cy.ts
│   ├── student-evaluation.cy.ts
│   ├── promotion-execution.cy.ts
│   └── execution-history.cy.ts
├── registration-numbers/
│   ├── format-creation.cy.ts
│   └── auto-generation.cy.ts
├── classes/
│   ├── class-creation.cy.ts
│   └── course-assignment.cy.ts
└── workflows/
    ├── approval-request.cy.ts
    └── approval-processing.cy.ts
```

## Test Data

### Required fixtures:
- `students.json` - List of sample students
- `classes.json` - Classes with programs and levels
- `exams.json` - Exams of various types
- `grades.json` - Sample grades
- `users.json` - Test users (admin, teacher, student)
- `promotion-rules.json` - Sample promotion rules

### Required seeds:
- Active academic year
- Programs with options
- Faculties and study cycles
- Standard exam types
- Registration number formats

## Custom Cypress Commands

### To implement in `cypress/support/commands.ts`:

```typescript
// Authentication
cy.loginAsAdmin()
cy.loginAsTeacher()
cy.loginAsStudent()
cy.logout()

// Navigation
cy.visitAdminPage(pageName)
cy.visitTeacherPage(pageName)

// Test data
cy.createStudent(data)
cy.createClass(data)
cy.createExam(data)
cy.enrollStudent(studentId, classId)

// Cleanup
cy.resetDatabase()
cy.clearNotifications()
```

## Success Criteria

A test is considered successful if:
1. ✅ It runs deterministically (no flakiness)
2. ✅ It starts from a known state (seeds/fixtures)
3. ✅ It checks business behavior (not just the UI)
4. ✅ It cleans up after itself
5. ✅ It fails clearly with an explicit message
6. ✅ It runs in under 30 seconds

## Target Coverage Metrics

- **Priority 1**: 100% coverage required
- **Priority 2**: 80% coverage recommended
- **Priority 3**: 50% coverage acceptable

## Next Steps

1. [ ] Configure Cypress following `cypress-e2e-guide.md`
2. [ ] Implement the custom commands
3. [ ] Create the base fixtures
4. [ ] Start with the Priority 1 tests (auth + grades)
5. [ ] Set up CI for automatic execution
6. [ ] Document the test patterns discovered

## References

- [Cypress installation guide](./cypress-e2e-guide.md)
- [System architecture](./architecture.md)
- [Seeding guide](./seed-playbook.md)
