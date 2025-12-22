# Exam Grade Delegation — Design Notes

## Problem Statement
Teachers currently edit exam grades directly in `/teacher/grades`. They cannot delegate data entry to assistants, which forces them to share accounts or handle updates manually. Administrators must also retain full edit capabilities for quality control. We need a way for teachers (or admins) to delegate grade editing to another profile in the same institution, with clear permission checks and auditability.

## High‑Level Goals
1. Allow a teacher to appoint one or more “grade editors” for a specific exam (or optionally for all exams in a class course).
2. Permit administrators to manage delegates and edit any exam without extra steps.
3. Surface delegation state in the UI so teachers know who can edit, and non‑authorized users see read‑only screens.
4. Preserve existing locking logic (locked exams still block everyone except admins) and log who submitted grades.

## Proposed Architecture
### Schema
Add a new `exam_grade_editors` table:
```
exam_grade_editors (
  id UUID PK,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  editor_profile_id UUID REFERENCES domain_users(id) ON DELETE CASCADE,
  granted_by_profile_id UUID REFERENCES domain_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (exam_id, editor_profile_id)
)
```
Later we can extend with `class_course_id` for course-level delegation if needed.

### Authorization Flow
Grade mutations (currently invoked via `exams.submitGrades`, `exams.lock`, etc.) should accept requests when:
1. `ctx.profile.id` matches the class course’s assigned teacher.
2. `ctx.permissions` includes admin/super-admin.
3. `ctx.profile.id` exists in `exam_grade_editors` for the target exam and belongs to the same institution/org.

### TRPC Additions
Create a router namespace `examGradeEditors` with:
```
assign: admin/teacher procedure {
  input: { examId: string, editorProfileId: string }
}
list: protected procedure { input: { examId: string } }
revoke: admin/teacher procedure { input: { id: string } }
```
`assign` should ensure the requester can edit the exam themselves (teacher or admin). `list` returns delegates plus metadata (`grantedBy`, `createdAt`). `revoke` removes the entry.

### UI Changes
#### Teacher Grade Entry (`apps/web/src/pages/teacher/GradeEntry.tsx`)
1. Update exam fetcher to include `canEdit` flag returned from the backend (server merges teacher/admin/delegate checks).
2. Wrap score inputs/import/export buttons in a guard: render read-only table + alert if `canEdit` is false (`Exam locked or you lack permission`).
3. Add a “Delegated Editors” card once an exam is selected:
   - List current delegates (name, email, granted date).
   - Button “Add editor” → modal with autocomplete search (query existing users in institution) and `examGradeEditors.assign`.
   - Each entry offers a “Revoke” button calling `examGradeEditors.revoke`.
4. For admins, expose the same management UI plus a filter to pick any class course (since admins may land on this page via `/admin/...` later).

#### Routing
Delegates should be able to navigate to `/teacher/grades/:courseId`. We must extend the list query (`classCourses.list`) or create a separate `delegatedGradeAccess.list` so that non-teachers see just the courses/exams they can edit.

### Audit & Telemetry
Re-use existing grade submission logging but include `editedByProfileId` per mutation so we can trace which delegate touched the grade.

### Testing Strategy
1. **Unit Tests (server)**:
   - `examGradeEditors.assign` rejects non-teachers for that course.
   - Grade submission accepts delegate, rejects random user.
   - Cascading deletes remove delegations when exam disappears.
2. **UI Tests**:
   - Teacher sees delegate list and can add/remove users.
   - Delegate logs in, sees only assigned exam(s), can submit scores, and sees read-only lock state when exam is locked.
3. **E2E**:
   - Scenario: Teacher assigns delegate → delegate imports grades → teacher locks exam → delegate loses edit rights.

### Open Questions / Future Enhancements
- Should delegation operate at class-course level (all exams within a course) or per exam only? For first iteration we scope to per exam (simpler, direct mapping).
- Do we need expiration dates for delegations? Not in MVP; we rely on manual revoke.
- Should admins be able to assign delegates on behalf of teacher? Yes — same mutations but gated by admin role.
