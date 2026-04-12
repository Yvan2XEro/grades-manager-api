/**
 * Deliberation & promotion test seeder.
 *
 * Builds on top of the foundation seed (bun run --filter server seed) and adds:
 *   - Deliberation rules (exclusion → repeat → deferral → compensation → admission)
 *   - Students with realistic grade distributions (20 per BTS1 class)
 *   - Exams (CC 40% + FINAL 60%, status "approved") for every class course
 *   - Grades that produce a mix of all five decision outcomes
 *   - Class courses mirrored from group A → group B where missing
 *
 * Only BTS1 (orderIndex = 1) classes in the active academic year receive students.
 * BTS2 classes are intentionally left empty — they serve as promotion targets.
 *
 * Run: bun run --filter server seed:deliberation-test
 * Idempotent: safe to run multiple times (uses onConflictDoNothing everywhere).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker/locale/fr";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { closeDatabase, db } from "../db";
import * as schema from "../db/schema/app-schema";
import * as authSchema from "../db/schema/auth";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const STUDENTS_PER_CLASS = 20;
const CC_PERCENTAGE = 40;
const EXAM_PERCENTAGE = 60;

type GradeProfile =
	| "excellent"
	| "good"
	| "borderline"
	| "weak"
	| "failing"
	| "eliminatory";

/** Weights control the deliberation outcome mix. */
const GRADE_PROFILES: { profile: GradeProfile; weight: number }[] = [
	{ profile: "excellent", weight: 3 }, // ~15% → admitted (high mention)
	{ profile: "good", weight: 5 }, // ~25% → admitted
	{ profile: "borderline", weight: 4 }, // ~20% → compensated (avg 10-12, some UEs borderline)
	{ profile: "weak", weight: 4 }, // ~20% → deferred (avg 8-10)
	{ profile: "failing", weight: 3 }, // ~15% → repeat (avg < 8)
	{ profile: "eliminatory", weight: 1 }, // ~5%  → excluded (score < 5 in at least 1 course)
];

function pickProfile(): GradeProfile {
	const total = GRADE_PROFILES.reduce((s, p) => s + p.weight, 0);
	let r = Math.random() * total;
	for (const p of GRADE_PROFILES) {
		r -= p.weight;
		if (r <= 0) return p.profile;
	}
	return "good";
}

/**
 * Score ranges per profile.
 * ueIndex adds inter-UE variation so some students shine in one UE, struggle in another.
 */
function generateScore(profile: GradeProfile, ueIndex: number): number {
	const jitter = (Math.random() - 0.5) * (ueIndex === 0 ? 0 : 3);
	let base: number;
	switch (profile) {
		case "excellent":
			base = faker.number.float({ min: 14, max: 19.5, fractionDigits: 2 });
			break;
		case "good":
			base = faker.number.float({ min: 11, max: 15, fractionDigits: 2 });
			break;
		case "borderline":
			base = faker.number.float({ min: 9, max: 13, fractionDigits: 2 });
			break;
		case "weak":
			base = faker.number.float({ min: 6, max: 10, fractionDigits: 2 });
			break;
		case "failing":
			base = faker.number.float({ min: 3, max: 8, fractionDigits: 2 });
			break;
		case "eliminatory":
			// Guaranteed at least one score below 5 (first UE) — rest mediocre
			base =
				ueIndex === 0
					? faker.number.float({ min: 0, max: 4.5, fractionDigits: 2 })
					: faker.number.float({ min: 5, max: 10, fractionDigits: 2 });
			break;
	}
	return Math.max(
		0,
		Math.min(20, Number.parseFloat((base + jitter).toFixed(2))),
	);
}

// ---------------------------------------------------------------------------
// Deliberation rules — one complete set covering all five decisions
// ---------------------------------------------------------------------------

type DelibRuleDef = {
	name: string;
	description: string;
	category: schema.DeliberationRuleCategory;
	decision: schema.DeliberationDecision;
	priority: number;
	ruleset: Record<string, unknown>;
};

const DELIBERATION_RULES: DelibRuleDef[] = [
	// --- Exclusion (first evaluated) ---
	{
		name: "Exclusion — note éliminatoire absolue",
		description: "Exclu si au moins une note inférieure à 5/20",
		category: "exclusion",
		decision: "excluded",
		priority: 0,
		ruleset: {
			name: "exclusion-eliminatory",
			conditions: {
				all: [{ fact: "lowestScore", operator: "lessThan", value: 5 }],
			},
			event: {
				type: "exclusion",
				params: { message: "Note éliminatoire (< 5) détectée" },
			},
		},
	},

	// --- Repeat (redoublement) ---
	{
		name: "Redoublement — moyenne générale < 8",
		description: "Redouble si la moyenne générale pondérée est inférieure à 8",
		category: "repeat",
		decision: "repeat",
		priority: 0,
		ruleset: {
			name: "repeat-low-average",
			conditions: {
				all: [{ fact: "overallAverage", operator: "lessThan", value: 8 }],
			},
			event: {
				type: "repeat",
				params: {
					message: "Moyenne générale insuffisante pour poursuivre (< 8)",
				},
			},
		},
	},

	// --- Deferral (ajourné) ---
	{
		name: "Ajourné — moyenne < 10 sans compensation possible",
		description:
			"Ajourné si moyenne entre 8 et 10 avec trop d'UE non compensables",
		category: "deferral",
		decision: "deferred",
		priority: 0,
		ruleset: {
			name: "deferral-below-passing",
			conditions: {
				all: [{ fact: "overallAverage", operator: "lessThan", value: 10 }],
			},
			event: {
				type: "deferral",
				params: { message: "Moyenne insuffisante pour la promotion (< 10)" },
			},
		},
	},

	// --- Compensation ---
	{
		name: "Admis par compensation d'UE",
		description:
			"Admis par compensation si moyenne >= 10 et au moins une UE compensable (8 ≤ moy UE < 10)",
		category: "compensation",
		decision: "compensated",
		priority: 0,
		ruleset: {
			name: "compensation-eligible",
			conditions: {
				all: [
					{
						fact: "overallAverage",
						operator: "greaterThanInclusive",
						value: 10,
					},
					{ fact: "compensableUECount", operator: "greaterThan", value: 0 },
					{ fact: "eliminatoryFailures", operator: "equal", value: 0 },
				],
			},
			event: {
				type: "compensation",
				params: { message: "Admis par compensation d'unités d'enseignement" },
			},
		},
	},

	// --- Admission (last, catch-all for avg >= 10 without pending UEs) ---
	{
		name: "Admis — moyenne >= 10",
		description: "Admis si moyenne générale >= 10 et toutes les UE validées",
		category: "admission",
		decision: "admitted",
		priority: 0,
		ruleset: {
			name: "standard-admission",
			conditions: {
				all: [
					{
						fact: "overallAverage",
						operator: "greaterThanInclusive",
						value: 10,
					},
				],
			},
			event: {
				type: "admission",
				params: { message: "Admis à la délibération" },
			},
		},
	},
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log("[seed-delib] Starting deliberation test seeding...");

	// -------------------------------------------------------------------------
	// 1. Resolve existing institution + organisation
	// -------------------------------------------------------------------------
	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.code, "INSES"),
	});
	if (!institution) {
		throw new Error(
			"Institution INSES not found. Run the foundation seed first:\n  bun run --filter server seed",
		);
	}
	if (!institution.organizationId) {
		throw new Error("Institution INSES has no linked organization.");
	}
	const organization = await db.query.organization.findFirst({
		where: eq(authSchema.organization.id, institution.organizationId),
	});
	if (!organization) {
		throw new Error("Organization not found for institution INSES.");
	}

	// -------------------------------------------------------------------------
	// 2. Resolve active academic year (students will be enrolled here)
	// -------------------------------------------------------------------------
	const activeYear = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.institutionId, institution.id),
			eq(schema.academicYears.isActive, true),
		),
	});
	if (!activeYear) {
		throw new Error("No active academic year found for INSES.");
	}
	console.log(`[seed-delib] Active academic year: ${activeYear.name}`);

	// -------------------------------------------------------------------------
	// 3. Resolve first semester
	// -------------------------------------------------------------------------
	const semester = await db.query.semesters.findFirst({
		where: eq(schema.semesters.code, "S1"),
	});

	// -------------------------------------------------------------------------
	// 4. Find SOURCE classes — BTS1 level (orderIndex = 1) in the active year
	//    BTS2 classes are kept empty; they are promotion targets.
	// -------------------------------------------------------------------------
	const allClassesInActiveYear = await db.query.classes.findMany({
		where: and(
			eq(schema.classes.institutionId, institution.id),
			eq(schema.classes.academicYear, activeYear.id),
		),
		with: { cycleLevel: true },
	});

	const sourceClasses = allClassesInActiveYear.filter(
		(c) => (c.cycleLevel?.orderIndex ?? 0) === 1,
	);

	if (sourceClasses.length === 0) {
		throw new Error(
			"No BTS1 (orderIndex=1) classes found in the active year. Run the foundation seed first.",
		);
	}
	console.log(
		`[seed-delib] Source classes (level 1): ${sourceClasses.map((c) => c.code).join(", ")}`,
	);

	// -------------------------------------------------------------------------
	// 5. Ensure all source classes have class courses — mirror A → B where missing
	// -------------------------------------------------------------------------

	// Ensure FIN101 is assigned to COMPT25-BTS1A
	const fin101 = await db.query.courses.findFirst({
		where: eq(schema.courses.code, "FIN101"),
	});
	const kombo = await db.query.domainUsers.findFirst({
		where: eq(schema.domainUsers.primaryEmail, "kombo@inses.cm"),
	});
	const comptBts1A = sourceClasses.find((c) => c.code === "COMPT25-BTS1A");
	if (fin101 && kombo && comptBts1A) {
		const exists = await db.query.classCourses.findFirst({
			where: and(
				eq(schema.classCourses.class, comptBts1A.id),
				eq(schema.classCourses.course, fin101.id),
			),
		});
		if (!exists) {
			await db
				.insert(schema.classCourses)
				.values({
					code: "CC-FIN101-COMPT1A",
					class: comptBts1A.id,
					course: fin101.id,
					teacher: kombo.id,
					institutionId: institution.id,
					semesterId: semester?.id ?? null,
				})
				.onConflictDoNothing();
			console.log("[seed-delib] ✓ Added missing CC-FIN101-COMPT1A");
		}
	}

	// Mirror INF25-BTS1A class courses → INF25-BTS1B
	const inf1A = sourceClasses.find((c) => c.code === "INF25-BTS1A");
	const inf1B = sourceClasses.find((c) => c.code === "INF25-BTS1B");
	if (inf1A && inf1B) {
		const inf1ACourses = await db.query.classCourses.findMany({
			where: eq(schema.classCourses.class, inf1A.id),
		});
		const inf1BCourses = await db.query.classCourses.findMany({
			where: eq(schema.classCourses.class, inf1B.id),
		});
		if (inf1ACourses.length > 0 && inf1BCourses.length === 0) {
			for (const cc of inf1ACourses) {
				await db
					.insert(schema.classCourses)
					.values({
						code: cc.code.replace("INF1A", "INF1B"),
						class: inf1B.id,
						course: cc.course,
						teacher: cc.teacher,
						institutionId: institution.id,
						semesterId: cc.semesterId,
					})
					.onConflictDoNothing();
			}
			console.log(
				`[seed-delib] ✓ Mirrored ${inf1ACourses.length} class courses → INF25-BTS1B`,
			);
		}
	}

	// -------------------------------------------------------------------------
	// 6. Load all class courses for source classes (after gap-fill above)
	// -------------------------------------------------------------------------
	const allClassCourses = await db.query.classCourses.findMany({
		where: eq(schema.classCourses.institutionId, institution.id),
		with: { courseRef: { with: { teachingUnit: true } } },
	});

	const ccByClass = new Map<string, typeof allClassCourses>();
	for (const cc of allClassCourses) {
		if (!sourceClasses.some((c) => c.id === cc.class)) continue;
		const arr = ccByClass.get(cc.class) ?? [];
		arr.push(cc);
		ccByClass.set(cc.class, arr);
	}

	// -------------------------------------------------------------------------
	// 7. Create deliberation rules (skip if already exist for this institution)
	// -------------------------------------------------------------------------
	const existingRules = await db.query.deliberationRules.findMany({
		where: eq(schema.deliberationRules.institutionId, institution.id),
	});

	if (existingRules.length === 0) {
		console.log("[seed-delib] Creating deliberation rules...");
		for (const def of DELIBERATION_RULES) {
			await db.insert(schema.deliberationRules).values({
				institutionId: institution.id,
				name: def.name,
				description: def.description,
				category: def.category,
				decision: def.decision,
				priority: def.priority,
				ruleset: def.ruleset,
				isActive: true,
			});
		}
		console.log(
			`[seed-delib] ✓ Created ${DELIBERATION_RULES.length} deliberation rules`,
		);
	} else {
		console.log(
			`[seed-delib] ✓ ${existingRules.length} deliberation rules already exist — skipped`,
		);
	}

	// -------------------------------------------------------------------------
	// 8. Create exams (CC + FINAL, status "approved") for all class courses
	// -------------------------------------------------------------------------
	console.log("[seed-delib] Creating exams...");
	const examsByCC = new Map<string, { ccExamId: string; exExamId: string }>();

	for (const cc of allClassCourses) {
		if (!sourceClasses.some((c) => c.id === cc.class)) continue;
		const ccExamId = `DELIB-CC-${cc.code}`;
		const exExamId = `DELIB-EX-${cc.code}`;

		await db
			.insert(schema.exams)
			.values([
				{
					id: ccExamId,
					name: `CC — ${cc.courseRef?.name ?? cc.code}`,
					type: "CC",
					date: new Date("2025-11-15T09:00:00Z"),
					percentage: CC_PERCENTAGE.toString(),
					classCourse: cc.id,
					institutionId: institution.id,
					status: "approved",
				},
				{
					id: exExamId,
					name: `Examen Final — ${cc.courseRef?.name ?? cc.code}`,
					type: "FINAL",
					date: new Date("2026-01-20T09:00:00Z"),
					percentage: EXAM_PERCENTAGE.toString(),
					classCourse: cc.id,
					institutionId: institution.id,
					status: "approved",
				},
			])
			.onConflictDoNothing();

		examsByCC.set(cc.id, { ccExamId, exExamId });
	}
	console.log("[seed-delib] ✓ Exams created (or already existed)");

	// -------------------------------------------------------------------------
	// 9. Generate students, enrollments and grades for each source class
	// -------------------------------------------------------------------------
	console.log("[seed-delib] Generating students and grades...");
	let totalStudents = 0;
	let totalGrades = 0;

	for (const klass of sourceClasses) {
		const ccs = ccByClass.get(klass.id) ?? [];
		if (ccs.length === 0) {
			console.log(
				`[seed-delib]   Skipping ${klass.code} — no class courses found`,
			);
			continue;
		}

		// Build a UE-index map so students score consistently within a UE
		const ueIndexMap = new Map<string, number>();
		let ueIdx = 0;
		for (const cc of ccs) {
			const ueId = cc.courseRef?.teachingUnitId ?? cc.id;
			if (!ueIndexMap.has(ueId)) ueIndexMap.set(ueId, ueIdx++);
		}

		for (let i = 0; i < STUDENTS_PER_CLASS; i++) {
			const firstName = faker.person.firstName();
			const lastName = faker.person.lastName().toUpperCase();
			const email = faker.internet
				.email({ firstName, lastName, provider: "test-delib.local" })
				.toLowerCase();
			const regNum = `DELIB-${klass.code}-${String(i + 1).padStart(3, "0")}`;
			const profile = pickProfile();
			const now = new Date();

			// Auth user
			const authUserId = `delib_${randomUUID()}`;
			await db
				.insert(authSchema.user)
				.values({
					id: authUserId,
					email,
					name: `${firstName} ${lastName}`,
					emailVerified: true,
					role: "user",
					banned: false,
					banReason: null,
					banExpires: null,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoNothing();

			await db
				.insert(authSchema.account)
				.values({
					id: randomUUID(),
					userId: authUserId,
					accountId: authUserId,
					providerId: "credential",
					password: await hashPassword("Password123!"),
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoNothing();

			// Org member
			const memberId = randomUUID();
			await db
				.insert(authSchema.member)
				.values({
					id: memberId,
					organizationId: organization.id,
					userId: authUserId,
					role: "member",
					createdAt: now,
				})
				.onConflictDoNothing();

			// Domain user
			const [domainUser] = await db
				.insert(schema.domainUsers)
				.values({
					authUserId,
					memberId,
					firstName,
					lastName,
					primaryEmail: email,
					phone: faker.phone.number({ style: "international" }),
					dateOfBirth: faker.date
						.birthdate({ min: 18, max: 28, mode: "age" })
						.toISOString()
						.split("T")[0],
					placeOfBirth: faker.location.city(),
					gender: faker.helpers.arrayElement(["male", "female"] as const),
					nationality: "CM",
					status: "active",
				})
				.returning();

			// Student
			const rows = await db
				.insert(schema.students)
				.values({
					domainUserId: domainUser.id,
					class: klass.id,
					registrationNumber: regNum,
					institutionId: institution.id,
				})
				.onConflictDoNothing()
				.returning();

			const student = rows[0];
			if (!student) continue; // duplicate registration number — skip

			// Enrollment
			await db.insert(schema.enrollments).values({
				studentId: student.id,
				classId: klass.id,
				academicYearId: activeYear.id,
				status: "active",
				enrolledAt: now,
				institutionId: institution.id,
				admissionType: "normal",
				transferCredits: 0,
			});

			// Course enrollments + grades
			for (const cc of ccs) {
				const ueId = cc.courseRef?.teachingUnitId ?? cc.id;
				const ueIndex = ueIndexMap.get(ueId) ?? 0;
				const credits = cc.courseRef?.teachingUnit?.credits ?? 3;

				await db
					.insert(schema.studentCourseEnrollments)
					.values({
						studentId: student.id,
						classCourseId: cc.id,
						courseId: cc.course,
						sourceClassId: klass.id,
						academicYearId: activeYear.id,
						status: "active",
						attempt: 1,
						creditsAttempted: credits,
						creditsEarned: 0,
					})
					.onConflictDoNothing();

				const exams = examsByCC.get(cc.id);
				if (exams) {
					await db
						.insert(schema.grades)
						.values([
							{
								student: student.id,
								exam: exams.ccExamId,
								score: generateScore(profile, ueIndex).toString(),
							},
							{
								student: student.id,
								exam: exams.exExamId,
								score: generateScore(profile, ueIndex).toString(),
							},
						])
						.onConflictDoNothing();
					totalGrades += 2;
				}
			}

			totalStudents++;
		}

		console.log(
			`[seed-delib]   ${klass.code}: ${STUDENTS_PER_CLASS} students (${ccs.length} courses each)`,
		);
	}

	// -------------------------------------------------------------------------
	// Done
	// -------------------------------------------------------------------------
	console.log("\n[seed-delib] ✓ Done!");
	console.log(`[seed-delib]   Students created : ${totalStudents}`);
	console.log(`[seed-delib]   Grades created   : ${totalGrades}`);
	console.log("[seed-delib]   Grade distribution (approximate):");
	console.log("[seed-delib]     ~15% excellent  → admitted");
	console.log("[seed-delib]     ~25% good       → admitted");
	console.log("[seed-delib]     ~20% borderline → compensated");
	console.log("[seed-delib]     ~20% weak       → deferred");
	console.log("[seed-delib]     ~15% failing    → repeat");
	console.log("[seed-delib]     ~ 5% eliminatory → excluded");
	console.log("\n[seed-delib] Next steps:");
	console.log(
		"[seed-delib]   1. Create a deliberation for INF25-BTS1A (active year)",
	);
	console.log("[seed-delib]   2. Open → Compute → Close → Sign");
	console.log(
		'[seed-delib]   3. Click "Promouvoir les admis" → select AY-2025 or AY-2026',
	);
	console.log(
		"[seed-delib]   4. INF25-BTS2A (AY-2025) or INF26-BTS2A (AY-2026) should appear as target",
	);

	await closeDatabase();
}

main().catch((err) => {
	console.error("[seed-delib] Failed:", err);
	process.exit(1);
});
