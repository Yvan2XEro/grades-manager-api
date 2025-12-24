# Seeder Modifications - Adaptation to Architectural Changes

Date: 2025-12-22

## 📋 Summary of Modifications

The seeder has been adapted to support:
1. **External students**: Admission fields in enrollments
2. **Faculties → institutions architecture**: Already implemented (faculties = institutions type='faculty')
3. **Auto-creation of enrollments**: Backward compatibility for existing seeds

## 🔧 Applied Modifications

### 1. Extended `EnrollmentSeed` Type

**File**: `apps/server/src/seed/runner.ts` (lines 222-235)

**Before**:
```typescript
type EnrollmentSeed = {
	studentCode: string;
	classCode: string;
	classAcademicYearCode?: string;
	academicYearCode: string;
	status?: EnrollmentStatus;
};
```

**After**:
```typescript
type EnrollmentSeed = {
	studentCode: string;
	classCode: string;
	classAcademicYearCode?: string;
	academicYearCode: string;
	status?: EnrollmentStatus;
	// External admission fields
	admissionType?: "normal" | "transfer" | "direct" | "equivalence";
	transferInstitution?: string;
	transferCredits?: number;
	transferLevel?: string;
	admissionJustification?: string;
	admissionDate?: string;
};
```

### 2. Enrollment Creation with Admission Fields

**File**: `apps/server/src/seed/runner.ts` (lines 1404-1442)

**Modification**:
- Added admission fields when inserting enrollments
- Update existing enrollments with new fields
- Convert `admissionDate` (string) to Date

**Code**:
```typescript
// During creation
await db.insert(schema.enrollments).values({
	studentId: student.id,
	classId: klass.id,
	academicYearId,
	status: entry.status ?? "active",
	enrolledAt: now,
	institutionId: klass.institutionId,
	// External admission fields
	admissionType: entry.admissionType ?? "normal",
	transferInstitution: entry.transferInstitution ?? null,
	transferCredits: entry.transferCredits ?? 0,
	transferLevel: entry.transferLevel ?? null,
	admissionJustification: entry.admissionJustification ?? null,
	admissionDate: entry.admissionDate
		? new Date(entry.admissionDate)
		: null,
});
```

### 3. Auto-Creation of Enrollments

**File**: `apps/server/src/seed/runner.ts` (lines 1368-1396)

**Functionality**:
- When creating a student, if no explicit enrollment is provided in YAML, a "normal" enrollment is automatically created
- Ensures backward compatibility with seeds that don't specify enrollments

**Code**:
```typescript
// Auto-create a default enrollment if not explicitly provided
const explicitEnrollment = data.enrollments?.find(
	(e) => normalizeCode(e.studentCode) === normalizeCode(entry.code),
);
if (!explicitEnrollment) {
	const academicYearId = state.academicYears.get(klass.academicYearCode);
	if (academicYearId) {
		const enrollmentExists = await db.query.enrollments.findFirst({
			where: and(
				eq(schema.enrollments.studentId, student.id),
				eq(schema.enrollments.classId, klass.id),
				eq(schema.enrollments.academicYearId, academicYearId),
			),
		});
		if (!enrollmentExists) {
			await db.insert(schema.enrollments).values({
				studentId: student.id,
				classId: klass.id,
				academicYearId,
				status: "active",
				enrolledAt: now,
				institutionId: klass.institutionId,
				admissionType: "normal",
				transferCredits: 0,
			});
		}
	}
}
```

## 📝 Usage in YAML Seeds

### Normal Student (Auto-enrollment)

**Old format (still supported)**:
```yaml
students:
  - code: STU001
    domainUserCode: USER001
    classCode: L1-INFO-A
    classAcademicYearCode: "2024-2025"
    registrationNumber: "2024001"
```

→ A "normal" enrollment will be automatically created

### Normal Student (Explicit Enrollment)

**New format**:
```yaml
students:
  - code: STU001
    domainUserCode: USER001
    classCode: L1-INFO-A
    classAcademicYearCode: "2024-2025"
    registrationNumber: "2024001"

enrollments:
  - studentCode: STU001
    classCode: L1-INFO-A
    academicYearCode: "2024-2025"
    status: active
    admissionType: normal
```

### Transferred Student

**New format with external admission**:
```yaml
students:
  - code: STU002
    domainUserCode: USER002
    classCode: L2-INFO-A
    classAcademicYearCode: "2024-2025"
    registrationNumber: "2024002"

enrollments:
  - studentCode: STU002
    classCode: L2-INFO-A
    academicYearCode: "2024-2025"
    status: active
    admissionType: transfer
    transferInstitution: "Université Paris-Saclay"
    transferCredits: 60
    transferLevel: "L2"
    admissionJustification: "Transfer from Paris-Saclay after L1 validation"
    admissionDate: "2024-09-01"
```

### Direct Admission

**Example**:
```yaml
enrollments:
  - studentCode: STU003
    classCode: M1-INFO-A
    academicYearCode: "2024-2025"
    status: active
    admissionType: direct
    admissionJustification: "Engineering degree + 5 years professional experience"
    admissionDate: "2024-09-01"
```

## ✅ Faculties → Institutions Architecture

**Current state**: Already correctly implemented

The seeder automatically converts faculties to institutions:

```yaml
# In foundation.yaml
faculties:
  - code: SCI
    name: "Faculty of Sciences"
    description: "Exact and natural sciences"
```

→ Created as:
```typescript
await db.insert(schema.institutions).values({
	code: "SCI",
	type: "faculty",  // ← Type = faculty
	nameFr: "Faculty of Sciences",
	nameEn: "Faculty of Sciences",
	shortName: "SCI",
	descriptionFr: "Exact and natural sciences",
	parentInstitutionId: null,
	organizationId: facultyOrgId,
});
```

`studyCycles`, `programs`, and other entities then use `institutionId` pointing to this faculty-institution.

## 🎯 Benefits

1. **Backward Compatibility**: Existing seeds continue to work
2. **External Admission Support**: Ability to create transferred/directly admitted students
3. **Flexibility**: Choice between auto-enrollment and explicit enrollment
4. **Consistency**: Architecture aligned with schema (admissions in enrollments)

## ⚠️ Important Notes

1. **Auto-enrollment**: Created only if:
   - No explicit enrollment for this student
   - Enrollment doesn't already exist in database
   - Class's academic year is found

2. **admissionDate**: ISO string format in YAML, automatically converted to Date

3. **transferCredits**:
   - Default: `0` for normal admissions
   - Must be specified for transfers

4. **Data Migration**: Existing seeds will work with auto-created "normal" enrollments

## 🧪 Testing

To test with a complete seed:

```bash
# Generate templates
bun run --filter server seed:scaffold

# Edit YAML files in seed/local/
# Add enrollments with external admissions

# Run seed
bun run --filter server seed
```

## ✅ Validation

- [x] `EnrollmentSeed` type extended
- [x] Enrollment creation with admission fields
- [x] Auto-creation of enrollments for backward compatibility
- [x] Faculties → institutions already implemented
- [x] No TypeScript errors on modifications
- [x] Complete documentation

## 🎉 Result

The seeder now fully supports the corrected architecture with:
- External admissions in enrollments
- Faculties as institutions
- Complete backward compatibility
