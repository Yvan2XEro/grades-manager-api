# Implementing Support for External Students

## Overview

This guide explains how to modify the system to handle students admitted directly from other institutions, with no internal academic history.

## Required Changes

### 1. Database Migration

Create the file: `apps/server/src/db/migrations/0003_add_external_students_support.sql`

```sql
-- Add admission type and transfer fields to students table
ALTER TABLE students
ADD COLUMN admission_type TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN transfer_institution TEXT,
ADD COLUMN transfer_credits INTEGER DEFAULT 0,
ADD COLUMN transfer_level TEXT,
ADD COLUMN admission_justification TEXT,
ADD COLUMN admission_date TIMESTAMP WITH TIME ZONE;

-- Create index for querying by admission type
CREATE INDEX idx_students_admission_type ON students(admission_type);

-- Add check constraint for admission_type values
ALTER TABLE students
ADD CONSTRAINT chk_students_admission_type
CHECK (admission_type IN ('normal', 'transfer', 'direct', 'equivalence'));

-- Comment on new columns
COMMENT ON COLUMN students.admission_type IS 'Type d''admission: normal (cursus standard), transfer (transfert depuis autre établissement), direct (admission directe), equivalence (équivalence de diplôme)';
COMMENT ON COLUMN students.transfer_institution IS 'Nom de l''établissement d''origine pour les transferts';
COMMENT ON COLUMN students.transfer_credits IS 'Nombre de crédits ECTS transférés et reconnus';
COMMENT ON COLUMN students.transfer_level IS 'Niveau d''admission (ex: L2, M1) pour les admissions directes';
COMMENT ON COLUMN students.admission_justification IS 'Justification de l''admission (décision de commission, équivalence, etc.)';
COMMENT ON COLUMN students.admission_date IS 'Date de la décision d''admission';
```

### 2. Updating the Drizzle Schema

**File:** `apps/server/src/db/schema/app-schema.ts`

```typescript
// Add the admission types
export const admissionTypes = [
	"normal",
	"transfer",
	"direct",
	"equivalence",
] as const;
export type AdmissionType = (typeof admissionTypes)[number];

// Update the students table definition (line ~494)
export const students = pgTable(
	"students",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		institutionId: text("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		domainUserId: text("domain_user_id")
			.notNull()
			.references(() => domainUsers.id, { onDelete: "restrict" }),
		registrationNumber: text("registration_number").notNull(),
		class: text("class_id")
			.notNull()
			.references(() => classes.id, { onDelete: "restrict" }),

		// New fields for external students
		admissionType: text("admission_type")
			.$type<AdmissionType>()
			.notNull()
			.default("normal"),
		transferInstitution: text("transfer_institution"),
		transferCredits: integer("transfer_credits").default(0),
		transferLevel: text("transfer_level"),
		admissionJustification: text("admission_justification"),
		admissionDate: timestamp("admission_date", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		unique("uq_students_registration").on(t.registrationNumber),
		unique("uq_students_domain_user").on(t.domainUserId),
		index("idx_students_institution_id").on(t.institutionId),
		index("idx_students_class_id").on(t.class),
		index("idx_students_domain_user_id").on(t.domainUserId),
		index("idx_students_admission_type").on(t.admissionType), // New index
	],
);
```

### 3. Updating the Facts Types

**File:** `apps/server/src/modules/promotion-rules/promotion-rules.types.ts`

```typescript
export interface StudentPromotionFacts {
	// Existing fields...
	studentId: string;
	registrationNumber: string;
	// ... all the existing fields

	// New fields for external students
	admissionType: "normal" | "transfer" | "direct" | "equivalence";
	isTransferStudent: boolean;
	isDirectAdmission: boolean;
	hasAcademicHistory: boolean;
	transferCredits: number;
	transferInstitution: string | null;
	transferLevel: string | null;
}
```

### 4. Updating the Facts Computation Service

**File:** `apps/server/src/modules/promotion-rules/student-facts.service.ts`

In the `computeStudentFacts` function, add after line 28:

```typescript
// Line ~50, in the facts object
const facts: StudentPromotionFacts = {
	// Existing fields...
	studentId: student.id,
	registrationNumber: student.registrationNumber,
	// ... (keep all the existing fields)

	// New fields for external students (add at the end)
	admissionType: student.admissionType,
	isTransferStudent: student.admissionType === "transfer",
	isDirectAdmission: student.admissionType === "direct" || student.admissionType === "equivalence",
	hasAcademicHistory: transcript.overallAverage > 0 || transcript.validatedCoursesCount > 0,
	transferCredits: student.transferCredits ?? 0,
	transferInstitution: student.transferInstitution ?? null,
	transferLevel: student.transferLevel ?? null,
};
```

### 5. Updating the Students Module - Zod Schemas

**File:** `apps/server/src/modules/students/students.zod.ts`

```typescript
import { z } from "zod";

// Add the schema for the admission type
export const admissionTypeSchema = z.enum([
	"normal",
	"transfer",
	"direct",
	"equivalence",
]);

// Update createSchema
export const createSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email().optional(),
	dateOfBirth: z.date().optional(),
	placeOfBirth: z.string().optional(),
	gender: z.enum(["M", "F"]).optional(),
	nationality: z.string().optional(),
	classId: z.string(),
	registrationNumber: z.string().optional(),
	formatId: z.string().optional(),

	// New optional fields
	admissionType: admissionTypeSchema.optional().default("normal"),
	transferInstitution: z.string().optional(),
	transferCredits: z.number().int().min(0).max(180).optional(),
	transferLevel: z.string().optional(),
	admissionJustification: z.string().optional(),
	admissionDate: z.date().optional(),
});

// Dedicated schema for external admission
export const externalAdmissionSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email().optional(),
	dateOfBirth: z.date().optional(),
	placeOfBirth: z.string().optional(),
	gender: z.enum(["M", "F"]).optional(),
	nationality: z.string().optional(),

	classId: z.string(),
	admissionType: admissionTypeSchema,
	transferInstitution: z.string().min(1),
	transferCredits: z.number().int().min(0),
	transferLevel: z.string().min(1),
	admissionJustification: z.string().min(10),
	admissionDate: z.date(),

	registrationNumber: z.string().optional(),
});
```

### 6. New Router for External Admissions

**File:** `apps/server/src/modules/students/students.router.ts`

Add this new procedure:

```typescript
import { adminProcedure } from "../../lib/trpc";
import { externalAdmissionSchema } from "./students.zod";

// Add in the router:
admitExternal: adminProcedure
	.input(externalAdmissionSchema)
	.mutation(async ({ ctx, input }) => {
		return service.admitExternalStudent(input, ctx.institution.id);
	}),
```

### 7. Service for External Admission

**File:** `apps/server/src/modules/students/students.service.ts`

Add this new function:

```typescript
import type { externalAdmissionSchema } from "./students.zod";
import type { z } from "zod";

type ExternalAdmissionInput = z.infer<typeof externalAdmissionSchema>;

export async function admitExternalStudent(
	data: ExternalAdmissionInput,
	institutionId: string,
) {
	return db.transaction(async (tx) => {
		// 1. Create the user profile
		const [profile] = await tx
			.insert(schema.domainUsers)
			.values({
				institutionId,
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				gender: data.gender,
				dateOfBirth: data.dateOfBirth?.toISOString(),
				placeOfBirth: data.placeOfBirth,
				nationality: data.nationality,
			})
			.returning();

		// 2. Generate the registration number if needed
		let registrationNumber = data.registrationNumber;
		if (!registrationNumber) {
			const classData = await tx.query.classes.findFirst({
				where: eq(schema.classes.id, data.classId),
			});
			if (!classData) throw new Error("Class not found");

			registrationNumber = await generateRegistrationNumber(
				classData,
				{
					firstName: data.firstName,
					lastName: data.lastName,
					nationality: data.nationality,
				},
				null, // Use the active format
			);
		}

		// 3. Create the student with an external admission type
		const [student] = await tx
			.insert(schema.students)
			.values({
				institutionId,
				domainUserId: profile.id,
				registrationNumber,
				class: data.classId,
				admissionType: data.admissionType,
				transferInstitution: data.transferInstitution,
				transferCredits: data.transferCredits,
				transferLevel: data.transferLevel,
				admissionJustification: data.admissionJustification,
				admissionDate: data.admissionDate,
			})
			.returning();

		// 4. Create the active enrollment
		const currentYear = await tx.query.academicYears.findFirst({
			where: eq(schema.academicYears.isActive, true),
		});

		if (currentYear) {
			await tx.insert(schema.enrollments).values({
				studentId: student.id,
				classId: data.classId,
				academicYearId: currentYear.id,
				status: "active",
			});
		}

		// 5. Create a credit ledger if credits are transferred
		if (data.transferCredits && data.transferCredits > 0 && currentYear) {
			await tx.insert(schema.studentCreditLedgers).values({
				studentId: student.id,
				academicYearId: currentYear.id,
				creditsEarned: data.transferCredits,
				creditsInProgress: 0,
				requiredCredits: 60, // Default value
			});
		}

		return student;
	});
}
```

### 8. User Interface - Admission Form

**File:** `apps/web/src/pages/admin/StudentManagement.tsx`

Add a button and a modal for external admissions:

```typescript
// In the StudentManagement component, add:
const [isExternalAdmissionOpen, setIsExternalAdmissionOpen] = useState(false);

// External admission form
const externalAdmissionForm = useForm({
	resolver: zodResolver(z.object({
		firstName: z.string().min(1),
		lastName: z.string().min(1),
		// ... other fields
		admissionType: z.enum(["transfer", "direct", "equivalence"]),
		transferInstitution: z.string().min(1),
		transferCredits: z.number().min(0),
		transferLevel: z.string(),
		admissionJustification: z.string().min(10),
	})),
});

// Mutation for external admission
const externalAdmissionMutation = useMutation({
	mutationFn: async (data) => {
		return trpcClient.students.admitExternal.mutate({
			...data,
			classId: selectedClassId,
		});
	},
	onSuccess: () => {
		toast.success("Étudiant externe admis avec succès");
		queryClient.invalidateQueries(["students"]);
		setIsExternalAdmissionOpen(false);
	},
});

// Button in the interface
<Button onClick={() => setIsExternalAdmissionOpen(true)}>
  <UserPlus className="mr-2 h-4 w-4" />
  Admettre un étudiant externe
</Button>
```

### 9. Promotion Rules for External Students

In the admin interface, create a "bypass" rule for external students:

**Name:** Direct Admission - External Students

**JSON rule:**
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
      "message": "Étudiant externe admis - Vérification manuelle des prérequis"
    }
  },
  "priority": 100
}
```

## Tests

### Test 1: Create a transfer student

```typescript
const result = await trpcClient.students.admitExternal.mutate({
	firstName: "Jean",
	lastName: "Dupont",
	classId: "class-l2-info",
	admissionType: "transfer",
	transferInstitution: "Université Paris-Saclay",
	transferCredits: 60,
	transferLevel: "L2",
	admissionJustification: "Transfert accepté par la commission pédagogique du 15/01/2025",
	admissionDate: new Date("2025-01-15"),
});
```

### Test 2: Evaluate with the external rule

```typescript
const evaluation = await trpcClient.promotionRules.evaluateClass.query({
	ruleId: "rule-external",
	sourceClassId: "class-l2-info",
	academicYearId: "year-2024-2025",
});

// The external student should be marked as eligible
console.log(evaluation.eligible); // Should contain Jean Dupont
```

## Migrating Existing Data

If you have existing students to mark as external:

```sql
-- Manually identify the external students
UPDATE students
SET
  admission_type = 'transfer',
  transfer_institution = 'À compléter',
  admission_date = created_at
WHERE id IN ('id1', 'id2', 'id3'); -- Replace with the real IDs
```

## Implementation Checklist

- [ ] Create and run the SQL migration
- [ ] Update the Drizzle schema
- [ ] Update the facts types
- [ ] Update the facts computation service
- [ ] Add the Zod schemas
- [ ] Create the external admission endpoint
- [ ] Create the admission service
- [ ] Add the user interface
- [ ] Create the promotion rules for external students
- [ ] Test the admission of an external student
- [ ] Test the evaluation with the rules
- [ ] Document the process for administrators

## Benefits of This Approach

1. **Full traceability**: Every external admission is justified and dated
2. **Flexibility**: Supports different admission types (transfer, equivalence, direct)
3. **Seamless integration**: External students are treated normally once admitted
4. **Rule compliance**: Automatic bypass for the initial promotion
5. **Audit**: Ability to generate reports on external admissions
