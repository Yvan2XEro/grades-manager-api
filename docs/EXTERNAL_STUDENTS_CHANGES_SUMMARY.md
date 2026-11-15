# Summary of Changes: Support for External Students

## ✅ Implemented Changes

### 1. Database Migration ✅

**File created:** `apps/server/src/db/migrations/0003_add_external_students_support.sql`

**Changes to the `students` table:**
- ✅ `admission_type` TEXT NOT NULL DEFAULT 'normal'
- ✅ `transfer_institution` TEXT
- ✅ `transfer_credits` INTEGER DEFAULT 0
- ✅ `transfer_level` TEXT
- ✅ `admission_justification` TEXT
- ✅ `admission_date` TIMESTAMP WITH TIME ZONE
- ✅ Index created on `admission_type`
- ✅ CHECK constraint for valid values

**Changes to the `enrollments` table:**
- ✅ `admission_metadata` JSONB DEFAULT '{}'

**Migration journal:**
- ✅ Updated `meta/_journal.json` with the new migration

### 2. Drizzle Schema ✅

**File:** `apps/server/src/db/schema/app-schema.ts`

**Types added:**
```typescript
export const admissionTypes = ["normal", "transfer", "direct", "equivalence"];
export type AdmissionType = (typeof admissionTypes)[number];
```

**`students` table updated (lines 503-538):**
- ✅ All new fields added
- ✅ Index created on `admissionType`

**`enrollments` table updated (line 744):**
- ✅ `admissionMetadata` field added

### 3. Promotion Types ✅

**File:** `apps/server/src/modules/promotion-rules/promotion-rules.types.ts`

**New fields in `StudentPromotionFacts` (lines 96-103):**
```typescript
admissionType: "normal" | "transfer" | "direct" | "equivalence";
isTransferStudent: boolean;
isDirectAdmission: boolean;
hasAcademicHistory: boolean;
transferCredits: number;
transferInstitution: string | null;
transferLevel: string | null;
```

### 4. Facts Computation Service ✅

**File:** `apps/server/src/modules/promotion-rules/student-facts.service.ts`

**Changes (lines 93-167):**
- ✅ Transferred credits are added to `creditsEarned`
- ✅ `creditDeficit` takes transferred credits into account
- ✅ `creditCompletionRate` includes transferred credits
- ✅ All advanced indicators recomputed with transferred credits
- ✅ New external fields computed and returned

### 5. Students Module - Zod Schemas ✅

**File:** `apps/server/src/modules/students/students.zod.ts`

**New schemas (lines 28-65):**
```typescript
const externalAdmissionFieldsSchema = z.object({
  admissionType: admissionTypeEnum.optional().default("normal"),
  transferInstitution: z.string().optional(),
  transferCredits: z.number().int().min(0).max(300).optional(),
  transferLevel: z.string().optional(),
  admissionJustification: z.string().optional(),
  admissionDate: z.coerce.date().optional(),
});

export const externalAdmissionSchema = profileSchema.merge(
  z.object({
    classId: z.string(),
    admissionType: admissionTypeEnum.refine(
      (val) => val !== "normal",
      "Admission type must be transfer, direct, or equivalence"
    ),
    transferInstitution: z.string().min(1),
    transferCredits: z.number().int().min(0).max(300),
    transferLevel: z.string().min(1),
    admissionJustification: z.string().min(10),
    admissionDate: z.coerce.date(),
    registrationNumber: z.string().optional(),
    registrationFormatId: z.string().optional(),
  })
).strict();
```

- ✅ `baseSchema` updated to include the external fields
- ✅ `updateSchema` updated to support the external fields
- ✅ New `externalAdmissionSchema` created

### 6. Students Module - Service ✅

**File:** `apps/server/src/modules/students/students.service.ts`

**`CreateStudentInput` type extended (lines 24-35):**
```typescript
type CreateStudentInput = {
  classId: string;
  registrationNumber?: string;
  registrationFormatId?: string;
  profile: StudentProfileInput;
  admissionType?: schema.AdmissionType;
  transferInstitution?: string;
  transferCredits?: number;
  transferLevel?: string;
  admissionJustification?: string;
  admissionDate?: Date;
};
```

**`createStudent` function updated (lines 105-136):**
- ✅ All external fields added on creation
- ✅ Admission metadata added to the enrollment if type ≠ normal

**New `admitExternalStudent` function (lines 317-357):**
```typescript
export async function admitExternalStudent(
  data: {
    classId: string;
    registrationNumber?: string;
    registrationFormatId?: string;
    profile: StudentProfileInput;
    admissionType: schema.AdmissionType;
    transferInstitution: string;
    transferCredits: number;
    transferLevel: string;
    admissionJustification: string;
    admissionDate: Date;
  },
  institutionId: string,
)
```
- ✅ Validates that the type is not "normal"
- ✅ Uses `createStudent` with the external fields

### 7. Students Module - Router ✅

**File:** `apps/server/src/modules/students/students.router.ts`

**Import added (line 10):**
```typescript
import { externalAdmissionSchema } from "./students.zod";
```

**`create` endpoint updated (lines 42-58):**
- ✅ All admission fields passed to the service

**New `admitExternal` endpoint (lines 59-77):**
```typescript
admitExternal: tenantAdminProcedure
  .input(externalAdmissionSchema)
  .mutation(({ ctx, input }) =>
    service.admitExternalStudent(
      {
        classId: input.classId,
        registrationNumber: input.registrationNumber,
        registrationFormatId: input.registrationFormatId,
        profile: mapProfile(input),
        admissionType: input.admissionType,
        transferInstitution: input.transferInstitution,
        transferCredits: input.transferCredits,
        transferLevel: input.transferLevel,
        admissionJustification: input.admissionJustification,
        admissionDate: input.admissionDate,
      },
      ctx.institution.id,
    ),
  ),
```

---

## 📋 Next Steps

### 1. Run the Migration

```bash
cd apps/server
bun db:migrate
```

### 2. Test the Endpoints

**Test 1: Create a normal student**
```typescript
await trpcClient.students.create.mutate({
  firstName: "Test",
  lastName: "Student",
  email: "test@example.com",
  classId: "class-id",
  admissionType: "normal", // Optional, default
});
```

**Test 2: Admit an external student**
```typescript
await trpcClient.students.admitExternal.mutate({
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@example.com",
  classId: "class-l2-info",
  admissionType: "transfer",
  transferInstitution: "Université Paris-Saclay",
  transferCredits: 60,
  transferLevel: "L2",
  admissionJustification: "Transfert accepté par commission pédagogique",
  admissionDate: new Date("2025-01-15"),
});
```

**Test 3: Evaluate an external student with a promotion rule**
```typescript
const evaluation = await trpcClient.promotionRules.evaluateClass.query({
  ruleId: "rule-id",
  sourceClassId: "class-l2-info",
  academicYearId: "year-2024-2025",
});

// The external student should appear in evaluation.eligible
// if a bypass rule is configured
```

### 3. Create Promotion Rules

In the admin interface (`/admin/promotion-rules`), create a bypass rule:

**Name:** "Admission Directe - Étudiants Externes" (Direct Admission - External Students)
**Priority:** 100

**JSON:**
```json
{
  "conditions": {
    "any": [
      {
        "fact": "isDirectAdmission",
        "operator": "equal",
        "value": true
      },
      {
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
      }
    ]
  },
  "event": {
    "type": "external-student-admitted",
    "params": {
      "message": "Étudiant externe admis - Vérification manuelle des prérequis effectuée"
    }
  },
  "priority": 100
}
```

### 4. User Interface (Optional)

Create a form in `apps/web/src/pages/admin/StudentManagement.tsx` for admitting external students, with:

- ✅ Standard profile fields (last name, first name, email, etc.)
- ✅ Admission type selection (transfer, direct, equivalence)
- ✅ Institution of origin field
- ✅ Input for transferred credits
- ✅ Admission level (L1, L2, M1, etc.)
- ✅ Text area for the justification
- ✅ Admission date picker

---

## 🎯 Benefits of This Implementation

1. **Full Traceability**
   - Every external admission is justified and dated
   - Metadata stored in the enrollment
   - Complete audit trail

2. **Flexibility**
   - Supports 4 admission types (normal, transfer, direct, equivalence)
   - Transferred credits automatically taken into account
   - Adaptable promotion rules

3. **Seamless Integration**
   - External students are treated normally after admission
   - Transferred credits count in all calculations
   - Compatible with the existing promotion system

4. **No Breaking Changes**
   - Existing students have `admissionType = "normal"`
   - The `create` endpoint still works normally
   - Full backward compatibility

5. **Powerful Rules System**
   - Automatic bypass for direct admissions
   - Specific rules for transfers with credits
   - Configurable priorities

---

## 📊 Statistics

- **7 files changed**
- **1 migration file created**
- **2 new TypeScript types**
- **1 new API endpoint**
- **7 new database fields**
- **1 new service function**

---

## ⚠️ Important

**Before going to production:**
1. ✅ Run the migration on a test environment
2. ✅ Test all admission scenarios
3. ✅ Check that transferred credits are counted correctly
4. ✅ Make sure the promotion rules work
5. ✅ Train administrators on the new process
6. ✅ Document the external admission procedures

**Documentation to consult:**
- `/docs/PROMOTION_RULES_EXAMPLES.md` - Rule examples
- `/docs/EXTERNAL_STUDENTS_IMPLEMENTATION.md` - Detailed guide
