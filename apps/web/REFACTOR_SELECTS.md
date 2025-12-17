# Select Components Refactoring Plan

## Objective
Replace all native/shadcn Select components for coded entities (faculties, programs, classes, courses, etc.) with the new `CodedEntitySelect` component.

## Benefits
- ✅ Consistent UX across all forms
- ✅ Debounced search (300ms)
- ✅ Hybrid filtering (local + server)
- ✅ Better accessibility
- ✅ Code/name visibility for all entities
- ✅ Standardized error handling

## Affected Components (Priority Order)

### Priority 1 - Core Admin Forms (High Impact)

#### 1. ClassManagement.tsx
**Location**: `apps/web/src/pages/admin/ClassManagement.tsx`
**Selects to replace**:
- [ ] Program select → `CodedEntitySelect`
- [ ] Program Option select → `CodedEntitySelect`
- [ ] Cycle Level select → `CodedEntitySelect`
- [ ] Academic Year select → Keep native (not coded entity)
- [ ] Semester select → Keep native (not coded entity)

**Impact**: High - Used frequently by admins to create classes

#### 2. CourseManagement.tsx (Admin)
**Location**: `apps/web/src/pages/admin/CourseManagement.tsx`
**Selects to replace**:
- [ ] Program select → `CodedEntitySelect`
- [ ] Teacher select → Keep native (uses domainUserId, not code)

**Impact**: High - Core curriculum management

#### 3. ClassCourseManagement.tsx (Admin)
**Location**: `apps/web/src/pages/admin/ClassCourseManagement.tsx`
**Selects to replace**:
- [ ] Class select → `CodedEntitySelect`
- [ ] Course select → `CodedEntitySelect`
- [ ] Teacher select → Keep native

**Impact**: High - Links classes to courses

#### 4. ProgramManagement.tsx (Teacher/Admin)
**Location**: `apps/web/src/pages/teacher/ProgramManagement.tsx`
**Selects to replace**:
- [ ] Faculty select → `CodedEntitySelect`

**Impact**: Medium - Program creation

### Priority 2 - Enrollment & Student Management

#### 5. EnrollmentManagement.tsx
**Location**: `apps/web/src/pages/admin/EnrollmentManagement.tsx`
**Selects to replace**:
- [ ] Academic Year select → Keep native
- [ ] Class select → `CodedEntitySelect`

**Impact**: High - Enrollment operations

#### 6. StudentManagement.tsx (Admin)
**Location**: `apps/web/src/pages/admin/StudentManagement.tsx`
**Selects to replace**:
- [ ] Class select → `CodedEntitySelect`
- [ ] Registration Format select → Keep native (not coded entity)

**Impact**: High - Student registration

#### 7. RegistrationNumberFormatDetail.tsx
**Location**: `apps/web/src/pages/admin/RegistrationNumberFormatDetail.tsx`
**Selects to replace**:
- [ ] Class select (for preview) → `CodedEntitySelect`

**Impact**: Low - Admin utility

### Priority 3 - Teaching Units & Advanced Features

#### 8. TeachingUnitManagement.tsx
**Location**: `apps/web/src/pages/admin/TeachingUnitManagement.tsx`
**Selects to replace**:
- [ ] Program select → `CodedEntitySelect`

**Impact**: Medium - UE/EC management

#### 9. TeachingUnitDetail.tsx
**Location**: `apps/web/src/pages/admin/TeachingUnitDetail.tsx`
**Selects to replace**:
- [ ] Course select (for prerequisites) → `CodedEntitySelect`
- [ ] Teacher select → Keep native

**Impact**: Low - Prerequisite management

#### 10. StudyCycleManagement.tsx
**Location**: `apps/web/src/pages/admin/StudyCycleManagement.tsx`
**Selects to replace**:
- [ ] Faculty select → `CodedEntitySelect`

**Impact**: Medium - Cycle configuration

### Priority 4 - Reporting & Exports

#### 11. GradeExport.tsx (Admin)
**Location**: `apps/web/src/pages/admin/GradeExport.tsx`
**Selects to replace**:
- [ ] Academic Year select → Keep native
- [ ] Class select → `CodedEntitySelect`

**Impact**: Medium - Export functionality

#### 12. GradeExport.tsx (Teacher)
**Location**: `apps/web/src/pages/teacher/GradeExport.tsx`
**Selects to replace**:
- [ ] Academic Year select → Keep native
- [ ] Class select → `CodedEntitySelect`

**Impact**: Medium - Teacher exports

### Priority 5 - Scheduling & Workflows

#### 13. ExamScheduler.tsx
**Location**: `apps/web/src/pages/admin/ExamScheduler.tsx`
**Selects to replace**:
- [ ] Faculty select → `CodedEntitySelect`
- [ ] Academic Year select → Keep native
- [ ] Exam Type select → Keep native

**Impact**: Medium - Bulk exam scheduling

#### 14. WorkflowManager.tsx (Teacher)
**Location**: `apps/web/src/pages/teacher/WorkflowManager.tsx`
**Selects to replace**:
- [ ] Class Course select → `CodedEntitySelect`

**Impact**: Low - Workflow approvals

### Priority 6 - Promotion Rules

#### 15. evaluate-promotion.tsx
**Location**: `apps/web/src/pages/admin/promotion-rules/evaluate-promotion.tsx`
**Selects to replace**:
- [ ] Rule select → Keep native (not coded entity)
- [ ] Class select → `CodedEntitySelect`
- [ ] Academic Year select → Keep native

**Impact**: Medium - Student promotion

#### 16. execute-promotion.tsx
**Location**: `apps/web/src/pages/admin/promotion-rules/execute-promotion.tsx`
**Selects to replace**:
- [ ] Target Class select → `CodedEntitySelect`

**Impact**: Medium - Student promotion

#### 17. RuleManagement.tsx
**Location**: `apps/web/src/pages/admin/RuleManagement.tsx`
**Selects to replace**:
- [ ] Faculty select → `CodedEntitySelect`
- [ ] Cycle select → Keep native (not coded entity)
- [ ] Level select → Keep native (not coded entity)

**Impact**: Low - Rule configuration

### Priority 7 - Teacher Pages

#### 18. CourseManagement.tsx (Teacher)
**Location**: `apps/web/src/pages/teacher/CourseManagement.tsx`
**Selects to replace**:
- [ ] Program select → `CodedEntitySelect`
- [ ] Teacher select → Keep native

**Impact**: Low - Teacher course management

#### 19. ClassCourseManagement.tsx (Teacher)
**Location**: `apps/web/src/pages/teacher/ClassCourseManagement.tsx`
**Selects to replace**:
- [ ] Class select → `CodedEntitySelect`
- [ ] Course select → `CodedEntitySelect`
- [ ] Teacher select → Keep native

**Impact**: Low - Teacher assignments

#### 20. StudentManagement.tsx (Teacher)
**Location**: `apps/web/src/pages/teacher/StudentManagement.tsx`
**Selects to replace**:
- [ ] Class select → `CodedEntitySelect`

**Impact**: Low - Teacher student view

## Implementation Strategy

### Phase 1: Core Forms (Priority 1)
Start with high-impact admin forms:
1. ClassManagement
2. CourseManagement
3. ClassCourseManagement
4. ProgramManagement

**Estimated time**: 2-3 hours

### Phase 2: Enrollment & Students (Priority 2)
Student-facing operations:
1. EnrollmentManagement
2. StudentManagement
3. RegistrationNumberFormatDetail

**Estimated time**: 1-2 hours

### Phase 3: Teaching Units (Priority 3)
Advanced academic features:
1. TeachingUnitManagement
2. TeachingUnitDetail
3. StudyCycleManagement

**Estimated time**: 1-2 hours

### Phase 4: Reporting (Priority 4)
Export and reporting tools:
1. GradeExport (Admin)
2. GradeExport (Teacher)

**Estimated time**: 1 hour

### Phase 5: Workflows & Scheduling (Priority 5)
Background processes:
1. ExamScheduler
2. WorkflowManager

**Estimated time**: 1 hour

### Phase 6: Promotion & Rules (Priority 6)
Promotion system:
1. evaluate-promotion
2. execute-promotion
3. RuleManagement

**Estimated time**: 1-2 hours

### Phase 7: Teacher Pages (Priority 7)
Teacher-specific views:
1. Teacher CourseManagement
2. Teacher ClassCourseManagement
3. Teacher StudentManagement

**Estimated time**: 1 hour

## Technical Checklist (Per Component)

For each component being refactored:

### 1. Add tRPC search procedure (if not exists)
```typescript
// In apps/server/src/routers/{entity}.ts
search: publicProcedure
  .input(z.object({ query: z.string() }))
  .query(async ({ input, ctx }) => {
    return await ctx.db.query.{entities}.findMany({
      where: or(
        ilike({entities}.code, `%${input.query}%`),
        ilike({entities}.name, `%${input.query}%`)
      ),
      limit: 20,
    });
  })
```

### 2. Update component imports
```typescript
import { CodedEntitySelect } from "@/components/forms";
```

### 3. Add search state
```typescript
const [searchQuery, setSearchQuery] = useState("");
```

### 4. Update queries
```typescript
// Default list
const { data: defaultItems = [] } = trpc.{entity}.list.useQuery({ limit: 100 });

// Search query (conditional)
const { data: searchResults = [] } = trpc.{entity}.search.useQuery(
  { query: searchQuery },
  { enabled: searchQuery.length >= 2 }
);

// Combine results
const items = searchQuery.length >= 2 ? searchResults : defaultItems;
```

### 5. Replace Select component
```typescript
<CodedEntitySelect
  items={items}
  onSearch={setSearchQuery}
  value={form.watch("{entityCode}")}
  onChange={(code) => form.setValue("{entityCode}", code)}
  label={t("...")}
  placeholder={t("...")}
  error={form.formState.errors.{entityCode}?.message}
  searchMode="hybrid"
  getItemSubtitle={(item) => `Faculty: ${item.faculty?.name}`} // Optional
  getItemBadge={(item) => item.badge} // Optional
/>
```

### 6. Test the changes
- [ ] Form opens correctly
- [ ] Search works (debounced)
- [ ] Selection updates form state
- [ ] Validation works
- [ ] Error messages display
- [ ] Clearing selection works
- [ ] i18n translations work

### 7. Update i18n keys (if needed)
Add any missing translation keys to `en/translation.json` and `fr/translation.json`

## Backend Requirements Summary

Entities that need `search` procedures:
- [ ] faculties
- [ ] programs
- [ ] program_options
- [ ] classes
- [ ] courses
- [ ] class_courses
- [ ] cycle_levels

## Testing Plan

### Unit Tests
- [ ] CodedEntitySelect component tests
- [ ] useDebounce hook tests

### E2E Tests (Cypress)
- [ ] ClassManagement form (create/edit with new selects)
- [ ] CourseManagement form
- [ ] EnrollmentManagement with class select
- [ ] StudentManagement with class select

### Manual Testing
- [ ] Search performance (should feel instant)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Mobile responsiveness

## Rollback Plan

If issues arise:
1. Keep old Select components in Git history
2. Create feature flag: `USE_CODED_ENTITY_SELECT`
3. Can revert per-component if needed

## Success Metrics

- ✅ All Priority 1-4 components migrated
- ✅ No regressions in form functionality
- ✅ Search response time < 300ms
- ✅ All Cypress tests passing
- ✅ User feedback positive

## Notes

- Not all selects need replacement (e.g., gender, status enums)
- Only coded entities benefit from CodedEntitySelect
- Academic Year is NOT a coded entity (keep native Select)
- Teacher/User selects use domainUserId, not code
