/**
 * Test seeding script for deliberation functionality.
 *
 * This script REUSES existing production-seeded data (organizations, institutions,
 * programs, teaching units, courses, classes, class courses) and ADDS:
 * - Faker-generated students (15-25 per class)
 * - Enrollments + student course enrollments
 * - Exams (CC + EXAMEN per class course, status "approved")
 * - Grades with realistic score distributions producing a mix of outcomes
 *
 * Run: bun run --filter server seed:deliberation-test
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

// Grade distribution buckets — controls the mix of outcomes for deliberation
// Each student gets a "profile" that determines their grade range per UE
type GradeProfile = "excellent" | "good" | "borderline" | "weak" | "failing";
const GRADE_PROFILES: { profile: GradeProfile; weight: number }[] = [
	{ profile: "excellent", weight: 3 }, // ~15% — clearly admitted
	{ profile: "good", weight: 5 }, // ~25% — admitted
	{ profile: "borderline", weight: 5 }, // ~25% — compensation zone (8-11)
	{ profile: "weak", weight: 4 }, // ~20% — deferred (some UEs below bar)
	{ profile: "failing", weight: 3 }, // ~15% — clearly deferred
];

function pickGradeProfile(): GradeProfile {
	const totalWeight = GRADE_PROFILES.reduce((s, p) => s + p.weight, 0);
	let r = Math.random() * totalWeight;
	for (const p of GRADE_PROFILES) {
		r -= p.weight;
		if (r <= 0) return p.profile;
	}
	return "good";
}

function generateScore(profile: GradeProfile, ueIndex: number): number {
	// ueIndex adds variation: some students do better in one UE than another
	const shift = ueIndex === 0 ? 0 : (Math.random() - 0.5) * 3;
	let base: number;
	switch (profile) {
		case "excellent":
			base = faker.number.float({ min: 14, max: 19, fractionDigits: 2 });
			break;
		case "good":
			base = faker.number.float({ min: 11, max: 15, fractionDigits: 2 });
			break;
		case "borderline":
			base = faker.number.float({ min: 8, max: 12, fractionDigits: 2 });
			break;
		case "weak":
			base = faker.number.float({ min: 5, max: 10, fractionDigits: 2 });
			break;
		case "failing":
			base = faker.number.float({ min: 2, max: 7, fractionDigits: 2 });
			break;
	}
	return Math.max(
		0,
		Math.min(20, Number.parseFloat((base + shift).toFixed(2))),
	);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
	console.log("[seed-delib] Starting deliberation test seeding...");

	// 1. Resolve existing seeded entities
	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.code, "INSES"),
	});
	if (!institution) {
		throw new Error(
			"Institution INSES not found. Run the production seed first: bun run --filter server seed",
		);
	}

	if (!institution.organizationId) {
		throw new Error("Institution INSES has no organization");
	}
	const organization = await db.query.organization.findFirst({
		where: eq(authSchema.organization.id, institution.organizationId),
	});
	if (!organization) {
		throw new Error("Organization not found for institution INSES");
	}

	// Find active academic year
	const academicYear = await db.query.academicYears.findFirst({
		where: and(eq(schema.academicYears.institutionId, institution.id)),
	});
	if (!academicYear) {
		throw new Error("No academic year found for INSES");
	}

	// Find all classes for this institution
	const classes = await db.query.classes.findMany({
		where: eq(schema.classes.institutionId, institution.id),
	});
	if (classes.length === 0) {
		throw new Error("No classes found. Run production seed first.");
	}
	console.log(
		`[seed-delib] Found ${classes.length} classes: ${classes.map((c) => c.code).join(", ")}`,
	);

	// Find all class courses
	const allClassCourses = await db.query.classCourses.findMany({
		where: eq(schema.classCourses.institutionId, institution.id),
		with: { courseRef: { with: { teachingUnit: true } } },
	});

	// Ensure all classes have class courses — fill gaps
	const semester = await db.query.semesters.findFirst({
		where: eq(schema.semesters.code, "S1"),
	});

	// Add missing FIN101 class course for COMPT25-BTS1A
	const fin101Course = await db.query.courses.findFirst({
		where: eq(schema.courses.code, "FIN101"),
	});
	if (fin101Course) {
		const existingFin101CC = allClassCourses.find(
			(cc) => cc.course === fin101Course.id,
		);
		if (!existingFin101CC) {
			const comptClass = classes.find((c) => c.code === "COMPT25-BTS1A");
			const komboUser = await db.query.domainUsers.findFirst({
				where: eq(schema.domainUsers.primaryEmail, "kombo@inses.cm"),
			});
			if (comptClass && komboUser) {
				const [newCC] = await db
					.insert(schema.classCourses)
					.values({
						code: "CC-FIN101-COMPT1A",
						class: comptClass.id,
						course: fin101Course.id,
						teacher: komboUser.id,
						institutionId: institution.id,
						semesterId: semester?.id ?? null,
					})
					.onConflictDoNothing()
					.returning();
				if (newCC) {
					console.log(
						"[seed-delib] Created missing class course CC-FIN101-COMPT1A",
					);
				}
			}
		}
	}

	// Mirror class courses from INF25-BTS1A to INF25-BTS1B (same program, group B)
	const inf1A = classes.find((c) => c.code === "INF25-BTS1A");
	const inf1B = classes.find((c) => c.code === "INF25-BTS1B");
	if (inf1A && inf1B) {
		const inf1ACourses = allClassCourses.filter((cc) => cc.class === inf1A.id);
		const inf1BCourses = allClassCourses.filter((cc) => cc.class === inf1B.id);
		if (inf1BCourses.length === 0 && inf1ACourses.length > 0) {
			for (const cc of inf1ACourses) {
				const newCode = cc.code.replace("INF1A", "INF1B");
				await db
					.insert(schema.classCourses)
					.values({
						code: newCode,
						class: inf1B.id,
						course: cc.course,
						teacher: cc.teacher,
						institutionId: institution.id,
						semesterId: semester?.id ?? null,
					})
					.onConflictDoNothing();
			}
			console.log(
				`[seed-delib] Mirrored ${inf1ACourses.length} class courses from INF25-BTS1A to INF25-BTS1B`,
			);
		}
	}

	// Re-fetch class courses after potential insert
	const classCourses = await db.query.classCourses.findMany({
		where: eq(schema.classCourses.institutionId, institution.id),
		with: { courseRef: { with: { teachingUnit: true } } },
	});

	// Group class courses by class
	const classCoursesByClass = new Map<string, typeof classCourses>();
	for (const cc of classCourses) {
		const arr = classCoursesByClass.get(cc.class) ?? [];
		arr.push(cc);
		classCoursesByClass.set(cc.class, arr);
	}

	// 2. Create exams for all class courses (CC + EXAMEN, status approved)
	console.log("[seed-delib] Creating exams...");
	const examsByClassCourse = new Map<
		string,
		{ ccExam: string; exExam: string }
	>();

	for (const cc of classCourses) {
		const ccExamId = `DELIB-CC-${cc.code}`;
		const exExamId = `DELIB-EX-${cc.code}`;

		await db
			.insert(schema.exams)
			.values([
				{
					id: ccExamId,
					name: `CC - ${cc.courseRef?.name ?? cc.code}`,
					type: "CC",
					date: new Date("2025-11-15T09:00:00Z"),
					percentage: CC_PERCENTAGE.toString(),
					classCourse: cc.id,
					institutionId: institution.id,
					status: "approved",
				},
				{
					id: exExamId,
					name: `Examen - ${cc.courseRef?.name ?? cc.code}`,
					type: "FINAL",
					date: new Date("2026-01-20T09:00:00Z"),
					percentage: EXAM_PERCENTAGE.toString(),
					classCourse: cc.id,
					institutionId: institution.id,
					status: "approved",
				},
			])
			.onConflictDoNothing();

		examsByClassCourse.set(cc.id, { ccExam: ccExamId, exExam: exExamId });
	}
	console.log(
		`[seed-delib] Created ${classCourses.length * 2} exams (CC + EXAMEN per class course)`,
	);

	// 3. Generate students for each class
	console.log("[seed-delib] Generating students...");
	let totalStudents = 0;
	let totalGrades = 0;

	for (const klass of classes) {
		const ccForClass = classCoursesByClass.get(klass.id) ?? [];
		if (ccForClass.length === 0) {
			console.log(
				`[seed-delib] Skipping class ${klass.code} — no class courses`,
			);
			continue;
		}

		for (let i = 0; i < STUDENTS_PER_CLASS; i++) {
			const firstName = faker.person.firstName();
			const lastName = faker.person.lastName();
			const email = faker.internet
				.email({ firstName, lastName, provider: "test-delib.local" })
				.toLowerCase();
			const regNum = `DELIB-${klass.code}-${String(i + 1).padStart(3, "0")}`;

			// Create auth user
			const authUserId = `delib_${randomUUID()}`;
			const now = new Date();
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

			// Create account (password)
			const hashedPassword = await hashPassword("Password123!");
			await db
				.insert(authSchema.account)
				.values({
					id: randomUUID(),
					userId: authUserId,
					accountId: authUserId,
					providerId: "credential",
					password: hashedPassword,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoNothing();

			// Create member for organization
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

			// Create domain user
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

			// Create student
			const [student] = await db
				.insert(schema.students)
				.values({
					domainUserId: domainUser.id,
					class: klass.id,
					registrationNumber: regNum,
					institutionId: institution.id,
				})
				.onConflictDoNothing()
				.returning();

			if (!student) continue; // skip if regNum conflict

			// Create enrollment
			await db.insert(schema.enrollments).values({
				studentId: student.id,
				classId: klass.id,
				academicYearId: academicYear.id,
				status: "active",
				enrolledAt: now,
				institutionId: institution.id,
				admissionType: "normal",
				transferCredits: 0,
			});

			// Determine grade profile for this student
			const profile = pickGradeProfile();

			// Create student course enrollments + grades
			let ueIdx = 0;
			const ueMap = new Map<string, number>(); // ueId → ueIdx for consistent scoring
			for (const cc of ccForClass) {
				const ueId = cc.courseRef?.teachingUnitId;
				if (ueId && !ueMap.has(ueId)) {
					ueMap.set(ueId, ueIdx++);
				}

				const ueIndex = ueMap.get(ueId ?? "") ?? 0;

				// Student course enrollment
				const credits = cc.courseRef?.teachingUnit?.credits ?? 3;
				await db
					.insert(schema.studentCourseEnrollments)
					.values({
						studentId: student.id,
						classCourseId: cc.id,
						courseId: cc.course,
						sourceClassId: klass.id,
						academicYearId: academicYear.id,
						status: "active",
						attempt: 1,
						creditsAttempted: credits,
						creditsEarned: 0,
					})
					.onConflictDoNothing();

				// Grades
				const exams = examsByClassCourse.get(cc.id);
				if (exams) {
					const ccScore = generateScore(profile, ueIndex);
					const exScore = generateScore(profile, ueIndex);

					await db
						.insert(schema.grades)
						.values([
							{
								student: student.id,
								exam: exams.ccExam,
								score: ccScore.toString(),
							},
							{
								student: student.id,
								exam: exams.exExam,
								score: exScore.toString(),
							},
						])
						.onConflictDoNothing();
					totalGrades += 2;
				}
			}

			totalStudents++;
		}

		console.log(
			`[seed-delib] Class ${klass.code}: ${STUDENTS_PER_CLASS} students, ${ccForClass.length} courses`,
		);
	}

	console.log("[seed-delib] Done!");
	console.log(`[seed-delib] Total students created: ${totalStudents}`);
	console.log(`[seed-delib] Total grades created: ${totalGrades}`);
	console.log(
		"[seed-delib] Grade distribution: ~15% excellent, ~25% good, ~25% borderline, ~20% weak, ~15% failing",
	);
	console.log(
		"[seed-delib] You can now create a deliberation for any class and run compute().",
	);

	await closeDatabase();
}

main().catch((error) => {
	console.error("[seed-delib] Failed:", error);
	process.exit(1);
});
