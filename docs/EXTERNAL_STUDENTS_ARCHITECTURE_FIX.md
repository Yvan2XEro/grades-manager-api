# Architecture Fix: External Students

## 🎯 Problem Identified

External admission information (transfer, direct admission, equivalence) was stored in the `students` table, which implied that this information would be maintained throughout the student's entire academic career.

**Example of the problem**:
- A student admitted to L2 by transfer from another university
- They complete L2 and continue to L3
- In L3, they are still marked as "transferred student" ❌
- Transfer credits apply to all their years ❌

## ✅ Architectural Solution

Admission information is **specific to an enrollment** (enrollment), not to the student themselves.

### Corrected Architecture

```
students (permanent profile)
  ├── id
  ├── registrationNumber
  ├── domainUserId
  └── class

enrollments (annual class enrollment)
  ├── id
  ├── studentId
  ├── classId
  ├── academicYearId
  ├── status
  ├── admissionType ✅ (normal, transfer, direct, equivalence)
  ├── transferInstitution ✅
  ├── transferCredits ✅
  ├── transferLevel ✅
  ├── admissionJustification ✅
  └── admissionDate ✅
```

### Correct Logic

- **L2 (2024-2025)**: `admissionType='transfer'`, `transferCredits=60` → Transferred student
- **L3 (2025-2026)**: `admissionType='normal'`, `transferCredits=0` → Normal student

Transfer credits apply **only** to the admission year.

## 📋 Applied Changes

### 1. Schema Update (`app-schema.ts`)

**Before**:
```typescript
export const students = pgTable("students", {
  id: text("id").primaryKey(),
  admissionType: text("admission_type").$type<AdmissionType>().default("normal"),
  transferCredits: integer("transfer_credits").default(0),
  // ... other admission fields
});
```

**After**:
```typescript
export const students = pgTable("students", {
  id: text("id").primaryKey(),
  registrationNumber: text("registration_number").notNull(),
  domainUserId: text("domain_user_id").notNull(),
  class: text("class_id").notNull(),
  // No admission fields here!
});

export const enrollments = pgTable("enrollments", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  classId: text("class_id").notNull(),
  academicYearId: text("academic_year_id").notNull(),
  status: text("status").$type<EnrollmentStatus>().default("pending"),
  // External admission fields
  admissionType: text("admission_type").$type<AdmissionType>().default("normal"),
  transferInstitution: text("transfer_institution"),
  transferCredits: integer("transfer_credits").default(0),
  transferLevel: text("transfer_level"),
  admissionJustification: text("admission_justification"),
  admissionDate: timestamp("admission_date", { withTimezone: true }),
});
```

### 2. Students Service (`students.service.ts`)

**Before**:
```typescript
const [student] = await tx.insert(schema.students).values({
  class: input.classId,
  registrationNumber,
  domainUserId: profile.id,
  institutionId: klass.institutionId,
  admissionType: input.admissionType ?? "normal",  // ❌
  transferInstitution: input.transferInstitution,  // ❌
  transferCredits: input.transferCredits,          // ❌
  // ...
});
```

**After**:
```typescript
const [student] = await tx.insert(schema.students).values({
  class: input.classId,
  registrationNumber,
  domainUserId: profile.id,
  institutionId: klass.institutionId,
  // No admission fields!
});

await tx.insert(schema.enrollments).values({
  studentId: student.id,
  classId: input.classId,
  academicYearId: klass.academicYear,
  institutionId: klass.institutionId,
  status: "active",
  // Admission fields stored in enrollment ✅
  admissionType: input.admissionType ?? "normal",
  transferInstitution: input.transferInstitution ?? null,
  transferCredits: input.transferCredits ?? 0,
  transferLevel: input.transferLevel ?? null,
  admissionJustification: input.admissionJustification ?? null,
  admissionDate: input.admissionDate ?? null,
});
```

### 3. Student Facts Service (`student-facts.service.ts`)

**Before**:
```typescript
const student = await db.query.students.findFirst({
  where: eq(schema.students.id, studentId),
});

// Uses student.transferCredits directly ❌
creditsEarned: creditSummary.creditsEarned + (student.transferCredits ?? 0),
admissionType: student.admissionType,
```

**After**:
```typescript
const student = await db.query.students.findFirst({
  where: eq(schema.students.id, studentId),
});

// Retrieve active enrollment for academic year
const currentEnrollment = await db.query.enrollments.findFirst({
  where: and(
    eq(schema.enrollments.studentId, studentId),
    eq(schema.enrollments.academicYearId, academicYearId),
  ),
});

// Uses currentEnrollment.transferCredits ✅
creditsEarned: creditSummary.creditsEarned + (currentEnrollment?.transferCredits ?? 0),
admissionType: currentEnrollment?.admissionType ?? "normal",
```

## 🎯 Benefits of this Architecture

### 1. **Correct Logic**
- A student transferred to L2 becomes "normal" in L3
- Transfer credits apply only to admission year
- Each enrollment has its own characteristics

### 2. **Flexibility**
- A student can have multiple enrollments with different admission types
- Complete history preserved in enrollments
- Supports internal transfers (from one class to another)

### 3. **Data Consistency**
- No confusion between "who is the student" (students) and "how they are enrolled" (enrollments)
- Promotion facts always use current enrollment
- Complete audit trail in enrollments

### 4. **Concrete Examples**

#### Scenario 1: Transferred Student
```
Year 2024-2025 (L2)
  enrollment {
    admissionType: 'transfer',
    transferInstitution: 'Université Paris-Saclay',
    transferCredits: 60,
    transferLevel: 'L2'
  }
  → Total credits = L2 credits + 60 transfer credits

Year 2025-2026 (L3)
  enrollment {
    admissionType: 'normal',
    transferCredits: 0
  }
  → Total credits = L3 credits only
```

#### Scenario 2: Direct Admission to M1
```
Year 2024-2025 (M1)
  enrollment {
    admissionType: 'direct',
    admissionJustification: 'Engineering degree + 5 years experience',
    transferCredits: 0
  }
  → No L1-L3 credits, direct admission validated

Year 2025-2026 (M2)
  enrollment {
    admissionType: 'normal',
    transferCredits: 0
  }
  → Normal student now
```

## 📊 Impact on Promotion Rules

Rules now use fields from current enrollment:

```json
{
  "conditions": {
    "all": [
      {
        "fact": "isTransferStudent",
        "operator": "equal",
        "value": true
      },
      {
        "fact": "transferCredits",
        "operator": "greaterThanInclusive",
        "value": 30
      }
    ]
  },
  "event": {
    "type": "transfer-student-admitted"
  }
}
```

**Note**: `isTransferStudent` is `true` only for the year where `admissionType='transfer'`, not for following years.

## 🚀 Migration

### To migrate
```bash
cd apps/server
bun db:push
```

### Post-migration verification
```sql
-- Check enrollments with external admission
SELECT
  e.id,
  s.registration_number,
  e.admission_type,
  e.transfer_credits,
  e.transfer_institution,
  ay.code as academic_year
FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN academic_years ay ON e.academic_year_id = ay.id
WHERE e.admission_type != 'normal'
ORDER BY s.registration_number, ay.code;

-- Verify no admission fields in students
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name LIKE '%admission%';
-- Should return 0 rows
```

## 📝 Important Notes

1. **Backward Compatibility**: The `admissionMetadata` JSONB field is kept for compatibility
2. **Automatic Migration**: Existing data is automatically migrated from students to enrollments
3. **Default Values**: Old enrollments without admission data receive `admissionType='normal'`
4. **Frontend**: No changes required in frontend, API remains compatible

## ✅ Migration Checklist

- [x] Schema updated (students + enrollments)
- [x] students.service.ts updated
- [x] student-facts.service.ts updated
- [x] Create external student works
- [x] Promotion rules verified
- [x] Year progression tested (transfer → normal)
- [x] Documented behavior for admins

## 🎉 Final Result

Coherent architecture where:
- `students` = permanent student profile
- `enrollments` = annual enrollment with admission context
- Transfer credits are linked to enrollment, not student
- Business logic is correct and maintainable
