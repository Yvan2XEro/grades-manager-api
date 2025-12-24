# Implémentation du Support des Étudiants Externes

## Vue d'ensemble

Ce guide explique comment modifier le système pour gérer les étudiants admis directement d'autres établissements, sans historique académique interne.

## Modifications Requises

### 1. Migration de la Base de Données

Créer le fichier: `apps/server/src/db/migrations/0003_add_external_students_support.sql`

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

### 2. Mise à Jour du Schéma Drizzle

**Fichier:** `apps/server/src/db/schema/app-schema.ts`

```typescript
// Ajouter les types d'admission
export const admissionTypes = [
	"normal",
	"transfer",
	"direct",
	"equivalence",
] as const;
export type AdmissionType = (typeof admissionTypes)[number];

// Mettre à jour la définition de la table students (ligne ~494)
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

		// Nouveaux champs pour étudiants externes
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
		index("idx_students_admission_type").on(t.admissionType), // Nouvel index
	],
);
```

### 3. Mise à Jour des Types de Facts

**Fichier:** `apps/server/src/modules/promotion-rules/promotion-rules.types.ts`

```typescript
export interface StudentPromotionFacts {
	// Existing fields...
	studentId: string;
	registrationNumber: string;
	// ... tous les champs existants

	// Nouveaux champs pour étudiants externes
	admissionType: "normal" | "transfer" | "direct" | "equivalence";
	isTransferStudent: boolean;
	isDirectAdmission: boolean;
	hasAcademicHistory: boolean;
	transferCredits: number;
	transferInstitution: string | null;
	transferLevel: string | null;
}
```

### 4. Mise à Jour du Service de Calcul des Facts

**Fichier:** `apps/server/src/modules/promotion-rules/student-facts.service.ts`

Dans la fonction `computeStudentFacts`, ajouter après la ligne 28:

```typescript
// Ligne ~50, dans l'objet facts
const facts: StudentPromotionFacts = {
	// Existing fields...
	studentId: student.id,
	registrationNumber: student.registrationNumber,
	// ... (garder tous les champs existants)

	// Nouveaux champs pour étudiants externes (ajouter à la fin)
	admissionType: student.admissionType,
	isTransferStudent: student.admissionType === "transfer",
	isDirectAdmission: student.admissionType === "direct" || student.admissionType === "equivalence",
	hasAcademicHistory: transcript.overallAverage > 0 || transcript.validatedCoursesCount > 0,
	transferCredits: student.transferCredits ?? 0,
	transferInstitution: student.transferInstitution ?? null,
	transferLevel: student.transferLevel ?? null,
};
```

### 5. Mise à Jour du Module Students - Schémas Zod

**Fichier:** `apps/server/src/modules/students/students.zod.ts`

```typescript
import { z } from "zod";

// Ajouter le schéma pour le type d'admission
export const admissionTypeSchema = z.enum([
	"normal",
	"transfer",
	"direct",
	"equivalence",
]);

// Mettre à jour createSchema
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

	// Nouveaux champs optionnels
	admissionType: admissionTypeSchema.optional().default("normal"),
	transferInstitution: z.string().optional(),
	transferCredits: z.number().int().min(0).max(180).optional(),
	transferLevel: z.string().optional(),
	admissionJustification: z.string().optional(),
	admissionDate: z.date().optional(),
});

// Schéma spécifique pour admission externe
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

### 6. Nouveau Router pour Admissions Externes

**Fichier:** `apps/server/src/modules/students/students.router.ts`

Ajouter cette nouvelle procédure:

```typescript
import { adminProcedure } from "../../lib/trpc";
import { externalAdmissionSchema } from "./students.zod";

// Ajouter dans le router:
admitExternal: adminProcedure
	.input(externalAdmissionSchema)
	.mutation(async ({ ctx, input }) => {
		return service.admitExternalStudent(input, ctx.institution.id);
	}),
```

### 7. Service pour Admission Externe

**Fichier:** `apps/server/src/modules/students/students.service.ts`

Ajouter cette nouvelle fonction:

```typescript
import type { externalAdmissionSchema } from "./students.zod";
import type { z } from "zod";

type ExternalAdmissionInput = z.infer<typeof externalAdmissionSchema>;

export async function admitExternalStudent(
	data: ExternalAdmissionInput,
	institutionId: string,
) {
	return db.transaction(async (tx) => {
		// 1. Créer le profil utilisateur
		const [profile] = await tx
			.insert(schema.domainUsers)
			.values({
				institutionId,
				businessRole: "student",
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				gender: data.gender,
				dateOfBirth: data.dateOfBirth?.toISOString(),
				placeOfBirth: data.placeOfBirth,
				nationality: data.nationality,
			})
			.returning();

		// 2. Générer le matricule si nécessaire
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
				null, // Utiliser le format actif
			);
		}

		// 3. Créer l'étudiant avec type d'admission externe
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

		// 4. Créer l'inscription active
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

		// 5. Créer un ledger de crédits si des crédits sont transférés
		if (data.transferCredits && data.transferCredits > 0 && currentYear) {
			await tx.insert(schema.studentCreditLedgers).values({
				studentId: student.id,
				academicYearId: currentYear.id,
				creditsEarned: data.transferCredits,
				creditsInProgress: 0,
				requiredCredits: 60, // Valeur par défaut
			});
		}

		return student;
	});
}
```

### 8. Interface Utilisateur - Formulaire d'Admission

**Fichier:** `apps/web/src/pages/admin/StudentManagement.tsx`

Ajouter un bouton et un modal pour les admissions externes:

```typescript
// Dans le composant StudentManagement, ajouter:
const [isExternalAdmissionOpen, setIsExternalAdmissionOpen] = useState(false);

// Formulaire d'admission externe
const externalAdmissionForm = useForm({
	resolver: zodResolver(z.object({
		firstName: z.string().min(1),
		lastName: z.string().min(1),
		// ... autres champs
		admissionType: z.enum(["transfer", "direct", "equivalence"]),
		transferInstitution: z.string().min(1),
		transferCredits: z.number().min(0),
		transferLevel: z.string(),
		admissionJustification: z.string().min(10),
	})),
});

// Mutation pour admission externe
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

// Bouton dans l'interface
<Button onClick={() => setIsExternalAdmissionOpen(true)}>
  <UserPlus className="mr-2 h-4 w-4" />
  Admettre un étudiant externe
</Button>
```

### 9. Règles de Promotion pour Étudiants Externes

Créer dans l'interface admin une règle de "bypass" pour étudiants externes:

**Nom:** Admission Directe - Étudiants Externes

**Règle JSON:**
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

### Test 1: Créer un étudiant en transfert

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

### Test 2: Évaluer avec la règle externe

```typescript
const evaluation = await trpcClient.promotionRules.evaluateClass.query({
	ruleId: "rule-external",
	sourceClassId: "class-l2-info",
	academicYearId: "year-2024-2025",
});

// L'étudiant externe devrait être marqué comme éligible
console.log(evaluation.eligible); // Devrait contenir Jean Dupont
```

## Migration de Données Existantes

Si vous avez des étudiants existants à marquer comme externes:

```sql
-- Identifier manuellement les étudiants externes
UPDATE students
SET
  admission_type = 'transfer',
  transfer_institution = 'À compléter',
  admission_date = created_at
WHERE id IN ('id1', 'id2', 'id3'); -- Remplacer par les IDs réels
```

## Checklist d'Implémentation

- [ ] Créer et exécuter la migration SQL
- [ ] Mettre à jour le schéma Drizzle
- [ ] Mettre à jour les types de facts
- [ ] Mettre à jour le service de calcul des facts
- [ ] Ajouter les schémas Zod
- [ ] Créer le endpoint d'admission externe
- [ ] Créer le service d'admission
- [ ] Ajouter l'interface utilisateur
- [ ] Créer les règles de promotion pour externes
- [ ] Tester l'admission d'un étudiant externe
- [ ] Tester l'évaluation avec les règles
- [ ] Documenter le processus pour les administrateurs

## Avantages de cette Approche

1. **Traçabilité complète**: Chaque admission externe est justifiée et datée
2. **Flexibilité**: Supporte différents types d'admission (transfert, équivalence, direct)
3. **Intégration transparente**: Les étudiants externes sont traités normalement une fois admis
4. **Respect des règles**: Bypass automatique pour la promotion initiale
5. **Audit**: Possibilité de générer des rapports sur les admissions externes
