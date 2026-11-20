import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(60_000);

import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createCycleLevel,
	createDomainUser,
	createProgram,
	createStudent,
	createStudyCycle,
	createTeachingUnit,
	ensureStudentCourseEnrollment,
	makeTestContext,
} from "@/lib/test-utils";
import * as gradeScalesService from "@/modules/grade-scales/grade-scales.service";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

/**
 * Build an admin context whose profile.id exists in domain_users,
 * required because deliberation tables have FK constraints on createdBy.
 */
async function adminWithRealProfile() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

// ---------------------------------------------------------------------------
// Fixture: 2 UEs, each with 2 courses (CC + EX), one student
// ---------------------------------------------------------------------------

async function setupDeliberationFixture(opts?: {
	ue1Credits?: number;
	ue2Credits?: number;
	coefficients?: [number, number, number, number];
}) {
	const program = await createProgram();

	// Two-level cycle (L1 → L2) so promoTargets can auto-find the next class
	const cycle = await createStudyCycle({
		institutionId: program.institutionId,
	});
	const l1 = await createCycleLevel({
		cycleId: cycle.id,
		orderIndex: 1,
		code: "L1",
	});
	const l2 = await createCycleLevel({
		cycleId: cycle.id,
		orderIndex: 2,
		code: "L2",
	});

	// Source year for the deliberation; target year for promotion
	const academicYear = await createAcademicYear({
		name: "2023-2024",
		startDate: "2023-09-01",
		endDate: "2024-07-31",
	});
	const targetYear = await createAcademicYear({
		name: "2024-2025",
		startDate: "2024-09-01",
		endDate: "2025-07-31",
	});

	// Source class at L1 in source year
	const klass = await createClass({
		program: program.id,
		academicYear: academicYear.id,
		cycleLevelId: l1.id,
	});

	// Target class at L2 in target year — auto-discovered by promoTargets
	const targetClass = await createClass({
		program: program.id,
		academicYear: targetYear.id,
		cycleLevelId: l2.id,
	});

	const classRecord = await db.query.classes.findFirst({
		where: (c, { eq }) => eq(c.id, klass.id),
	});
	const semesterId = classRecord!.semesterId!;

	const coefficients = opts?.coefficients ?? [2, 3, 1, 4];

	// UE 1
	const ue1 = await createTeachingUnit({
		programId: program.id,
		credits: opts?.ue1Credits ?? 6,
	});
	const course1a = await createCourse({
		program: program.id,
		teachingUnitId: ue1.id,
	});
	const course1b = await createCourse({
		program: program.id,
		teachingUnitId: ue1.id,
	});
	const cc1a = await createClassCourse({
		class: klass.id,
		course: course1a.id,
		coefficient: coefficients[0].toString(),
		semesterId,
	});
	const cc1b = await createClassCourse({
		class: klass.id,
		course: course1b.id,
		coefficient: coefficients[1].toString(),
		semesterId,
	});

	// UE 2
	const ue2 = await createTeachingUnit({
		programId: program.id,
		credits: opts?.ue2Credits ?? 4,
	});
	const course2a = await createCourse({
		program: program.id,
		teachingUnitId: ue2.id,
	});
	const course2b = await createCourse({
		program: program.id,
		teachingUnitId: ue2.id,
	});
	const cc2a = await createClassCourse({
		class: klass.id,
		course: course2a.id,
		coefficient: coefficients[2].toString(),
		semesterId,
	});
	const cc2b = await createClassCourse({
		class: klass.id,
		course: course2b.id,
		coefficient: coefficients[3].toString(),
		semesterId,
	});

	// Student
	const student = await createStudent({ class: klass.id });
	for (const cc of [cc1a, cc1b, cc2a, cc2b]) {
		await ensureStudentCourseEnrollment(student.id, cc.id, "active");
	}

	return {
		program,
		cycle,
		l1,
		l2,
		academicYear,
		targetYear,
		klass,
		targetClass,
		semesterId,
		ue1,
		ue2,
		classCourses: { cc1a, cc1b, cc2a, cc2b },
		student,
	};
}

/** Helper to create CC + EX exams with grades for a class-course */
async function createExamsWithGrade(
	classCourseId: string,
	studentId: string,
	institutionId: string,
	ccScore: number,
	exScore: number,
	ccPercentage = 40,
	exPercentage = 60,
) {
	const [ccExam] = await db
		.insert(schema.exams)
		.values({
			name: `CC-${Math.random().toString(36).slice(2, 8)}`,
			type: "CC",
			date: new Date(),
			percentage: ccPercentage.toString(),
			classCourse: classCourseId,
			status: "approved",
			isLocked: false,
			scheduledAt: new Date(),
			validatedAt: new Date(),
			institutionId,
		})
		.returning();

	const [exExam] = await db
		.insert(schema.exams)
		.values({
			name: `EX-${Math.random().toString(36).slice(2, 8)}`,
			type: "EXAMEN",
			date: new Date(),
			percentage: exPercentage.toString(),
			classCourse: classCourseId,
			status: "approved",
			isLocked: false,
			scheduledAt: new Date(),
			validatedAt: new Date(),
			institutionId,
		})
		.returning();

	await db.insert(schema.grades).values([
		{ student: studentId, exam: ccExam.id, score: ccScore.toString() },
		{ student: studentId, exam: exExam.id, score: exScore.toString() },
	]);

	return { ccExam, exExam };
}

// ===========================================================================
// Tests
// ===========================================================================

describe("deliberations router", () => {
	// -----------------------------------------------------------------------
	// Auth
	// -----------------------------------------------------------------------

	it("requires auth for list", async () => {
		const caller = createCaller(makeTestContext());
		await expect(
			caller.deliberations.list({ limit: 10 }),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	it("requires admin for create", async () => {
		const caller = createCaller(makeTestContext({ role: "student" }));
		await expect(
			caller.deliberations.create({
				classId: "x",
				academicYearId: "y",
				type: "annual",
			}),
		).rejects.toHaveProperty("code");
	});

	// -----------------------------------------------------------------------
	// CRUD lifecycle
	// -----------------------------------------------------------------------

	describe("CRUD lifecycle", () => {
		it("creates, lists, gets, and deletes a deliberation", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);

			const { academicYear, klass } = await setupDeliberationFixture();

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});

			expect(delib.status).toBe("draft");
			expect(delib.classId).toBe(klass.id);

			// List
			const { items } = await admin.deliberations.list({ limit: 10 });
			expect(items.some((d: any) => d.id === delib.id)).toBe(true);

			// GetById
			const fetched = await admin.deliberations.getById({ id: delib.id });
			expect(fetched.id).toBe(delib.id);

			// Delete (only in draft)
			await admin.deliberations.delete({ id: delib.id });
			await expect(
				admin.deliberations.getById({ id: delib.id }),
			).rejects.toHaveProperty("code", "NOT_FOUND");
		});
	});

	// -----------------------------------------------------------------------
	// Jury composition
	// -----------------------------------------------------------------------

	describe("jury composition", () => {
		it("stores free-text president and members until the report is signed", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await setupDeliberationFixture();

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			const juryMembers = [
				{ name: "Pr. NDONGO Paul", role: "president" },
				{ name: "Dr. ATANGANA Marie", role: "member" },
			];

			// Editable while open and closed, not only in draft
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			await admin.deliberations.update({ id: delib.id, juryMembers });
			await admin.deliberations.transition({ id: delib.id, action: "close" });
			await admin.deliberations.update({
				id: delib.id,
				juryMembers: [...juryMembers, { name: "M. EKANI", role: "member" }],
			});

			const fetched = await admin.deliberations.getById({ id: delib.id });
			expect(fetched.juryMembers).toHaveLength(3);
			expect(fetched.juryMembers?.[0]).toMatchObject({
				name: "Pr. NDONGO Paul",
				role: "president",
			});

			// The PV export reads the free-text president
			const exported = await admin.deliberations.exportDiplomation({
				id: delib.id,
			});
			expect(exported.jury.president?.name).toBe("Pr. NDONGO Paul");
			expect(exported.jury.members.map((m) => m.role)).toEqual([
				"Membre",
				"Membre",
			]);

			await admin.deliberations.transition({ id: delib.id, action: "sign" });
			await expect(
				admin.deliberations.update({ id: delib.id, juryMembers }),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("refuses two presidents", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await setupDeliberationFixture();
			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await expect(
				admin.deliberations.update({
					id: delib.id,
					juryMembers: [
						{ name: "A", role: "president" },
						{ name: "B", role: "president" },
					],
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});
	});

	// -----------------------------------------------------------------------
	// Duplicate guard (JVL-7)
	// -----------------------------------------------------------------------

	describe("duplicate deliberation guard", () => {
		it("creating a second annual deliberation for the same class+year throws CONFLICT", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await setupDeliberationFixture();

			await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});

			// Second create with the same (classId, academicYearId, type) — no semesterId
			await expect(
				admin.deliberations.create({
					classId: klass.id,
					academicYearId: academicYear.id,
					type: "annual",
				}),
			).rejects.toHaveProperty("code", "CONFLICT");
		});

		it("two semester deliberations with the same semester throw CONFLICT", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass, semesterId } =
				await setupDeliberationFixture();

			await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "semester",
				semesterId,
			});

			await expect(
				admin.deliberations.create({
					classId: klass.id,
					academicYearId: academicYear.id,
					type: "semester",
					semesterId,
				}),
			).rejects.toHaveProperty("code", "CONFLICT");
		});
	});

	// -----------------------------------------------------------------------
	// State transitions
	// -----------------------------------------------------------------------

	describe("state transitions", () => {
		it("draft → open → closed → signed", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await setupDeliberationFixture();

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});

			// draft → open
			const opened = await admin.deliberations.transition({
				id: delib.id,
				action: "open",
			});
			expect(opened.status).toBe("open");

			// open → closed
			const closed = await admin.deliberations.transition({
				id: delib.id,
				action: "close",
			});
			expect(closed.status).toBe("closed");

			// closed → signed
			const signed = await admin.deliberations.transition({
				id: delib.id,
				action: "sign",
			});
			expect(signed.status).toBe("signed");
		});

		it("rejects invalid transitions", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await setupDeliberationFixture();

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});

			// Cannot close a draft
			await expect(
				admin.deliberations.transition({
					id: delib.id,
					action: "close",
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});
	});

	// -----------------------------------------------------------------------
	// Compute — LMD default decisions (no rules)
	// -----------------------------------------------------------------------

	describe("compute — LMD default decisions", () => {
		it("returns 'admitted' when all UEs validated (average >= 10)", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
			});

			const instId = klass.institutionId;

			// UE1: avg ≈ 12.8 (validated), UE2: avg ≈ 11.92 (validated)
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2a.id, student.id, instId, 8, 6);
			await createExamsWithGrade(cc2b.id, student.id, instId, 12, 14);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });

			const result = await admin.deliberations.compute({ id: delib.id });

			expect(result.results).toHaveLength(1);
			const sr = result.results[0];
			expect(sr.autoDecision).toBe("admitted");
			expect(sr.finalDecision).toBe("admitted");
			expect(sr.generalAverage).toBeGreaterThanOrEqual(10);

			// Check UE decisions use LMD codes
			expect(sr.ueResults.every((ue: any) => ue.decision === "ADM")).toBe(true);

			// All credits should be earned
			expect(sr.totalCreditsEarned).toBe(10); // 6 + 4
		});

		it("returns 'deferred' when general average < 10", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
				coefficients: [1, 1, 1, 1],
			});

			const instId = klass.institutionId;

			// All low grades → general average < 10
			await createExamsWithGrade(cc1a.id, student.id, instId, 4, 5);
			await createExamsWithGrade(cc1b.id, student.id, instId, 6, 7);
			await createExamsWithGrade(cc2a.id, student.id, instId, 3, 4);
			await createExamsWithGrade(cc2b.id, student.id, instId, 5, 6);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });

			const result = await admin.deliberations.compute({ id: delib.id });

			const sr = result.results[0];
			expect(sr.autoDecision).toBe("deferred");
			expect(sr.generalAverage).toBeLessThan(10);
			expect(sr.ueResults.every((ue: any) => ue.decision === "AJ")).toBe(true);
		});

		it("returns 'pending' when grades are missing", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				classCourses: { cc1a, cc1b },
				student,
			} = await setupDeliberationFixture();

			const instId = klass.institutionId;

			// Only grade UE1 courses, leave UE2 without grades
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, student.id, instId, 10, 12);
			// UE2 courses: no grades at all

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });

			const result = await admin.deliberations.compute({ id: delib.id });

			const sr = result.results[0];
			expect(sr.autoDecision).toBe("pending");
			// Incomplete results are not deliberated: no average, rank or mention
			expect(sr.generalAverage).toBeNull();
			expect(sr.rank).toBeNull();
			expect(sr.mention).toBeNull();
			expect(sr.factsSnapshot.partialAverage).toBeGreaterThan(10);
			expect(sr.factsSnapshot.incompleteUECount).toBe(1);

			// UE1 should be ADM, UE2 should be INC
			const ue1 = sr.ueResults.find((ue: any) => ue.decision === "ADM");
			const ue2 = sr.ueResults.find((ue: any) => ue.decision === "INC");
			expect(ue1).toBeTruthy();
			expect(ue2).toBeTruthy();
		});
	});

	// -----------------------------------------------------------------------
	// Compute — Inter-UE compensation
	// -----------------------------------------------------------------------

	describe("compute — inter-UE compensation", () => {
		it("compensates a UE (8 <= avg < 10) when general average >= 10", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
				coefficients: [1, 1, 1, 1],
			});

			const instId = klass.institutionId;

			// UE1: good grades → avg well above 10
			// course1a: CC=14, EX=16 → avg = 14*0.4+16*0.6 = 15.2
			// course1b: CC=12, EX=14 → avg = 12*0.4+14*0.6 = 13.2
			// UE1 avg = (15.2+13.2)/2 = 14.2 → ADM
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, student.id, instId, 12, 14);

			// UE2: borderline grades → avg between 8-10 (compensable)
			// course2a: CC=8, EX=9 → avg = 8*0.4+9*0.6 = 8.6
			// course2b: CC=9, EX=9 → avg = 9*0.4+9*0.6 = 9.0
			// UE2 avg = (8.6+9.0)/2 = 8.8 → Normally AJ, but compensable
			await createExamsWithGrade(cc2a.id, student.id, instId, 8, 9);
			await createExamsWithGrade(cc2b.id, student.id, instId, 9, 9);

			// General avg = (14.2*6 + 8.8*4) / (6+4) = (85.2+35.2)/10 = 12.04 → >= 10

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });

			const result = await admin.deliberations.compute({ id: delib.id });

			const sr = result.results[0];
			expect(sr.generalAverage).toBeGreaterThanOrEqual(10);
			expect(sr.autoDecision).toBe("admitted"); // All UEs valid or compensated

			// Find UE2 result (the compensated one)
			const compensatedUe = sr.ueResults.find(
				(ue: any) => ue.decision === "CMP",
			);
			expect(compensatedUe).toBeTruthy();
			expect(compensatedUe!.creditsEarned).toBe(4); // Credits awarded by compensation

			// UE1 should be ADM
			const admittedUe = sr.ueResults.find((ue: any) => ue.decision === "ADM");
			expect(admittedUe).toBeTruthy();

			// Total credits = all earned (6 + 4)
			expect(sr.totalCreditsEarned).toBe(10);
		});

		it("does NOT compensate a UE with avg < 8 even if general >= 10", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
				coefficients: [1, 1, 1, 1],
			});

			const instId = klass.institutionId;

			// UE1: very high grades to pull general average above 10
			// course1a: CC=18, EX=19 → avg = 18.6
			// course1b: CC=17, EX=18 → avg = 17.6
			// UE1 avg = 18.1 → ADM
			await createExamsWithGrade(cc1a.id, student.id, instId, 18, 19);
			await createExamsWithGrade(cc1b.id, student.id, instId, 17, 18);

			// UE2: low grades → avg < 8 (NOT compensable)
			// course2a: CC=4, EX=5 → avg = 4.6
			// course2b: CC=5, EX=6 → avg = 5.6
			// UE2 avg = 5.1 → AJ (below compensation bar of 8)
			await createExamsWithGrade(cc2a.id, student.id, instId, 4, 5);
			await createExamsWithGrade(cc2b.id, student.id, instId, 5, 6);

			// General avg = (18.1*6 + 5.1*4) / (6+4) = (108.6+20.4)/10 = 12.9 → >= 10

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });

			const result = await admin.deliberations.compute({ id: delib.id });

			const sr = result.results[0];
			expect(sr.generalAverage).toBeGreaterThanOrEqual(10);

			// UE2 should remain AJ (not compensated because avg < 8)
			const failedUe = sr.ueResults.find((ue: any) => ue.decision === "AJ");
			expect(failedUe).toBeTruthy();
			expect(failedUe!.creditsEarned).toBe(0);

			// Decision should be "compensated" (avg >= 10, but UE below bar)
			expect(sr.autoDecision).toBe("compensated");

			// Only UE1 credits earned
			expect(sr.totalCreditsEarned).toBe(6);
		});
	});

	// -----------------------------------------------------------------------
	// Compute — rank, mention, stats
	// -----------------------------------------------------------------------

	describe("compute — rank and mention", () => {
		it("computes rank and mention for students", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
			});

			const instId = klass.institutionId;

			// Good grades
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2a.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2b.id, student.id, instId, 12, 14);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });

			const result = await admin.deliberations.compute({ id: delib.id });

			const sr = result.results[0];
			expect(sr.rank).toBe(1);
			expect(sr.mention).toBeTruthy();
			expect(result.stats).toBeTruthy();
			expect(result.stats.totalStudents).toBe(1);
		});

		it("does not rank, mention or decide for a student with incomplete results, even when rules match", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				program,
				academicYear,
				klass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture();
			const instId = klass.institutionId;

			// Complete student
			await createExamsWithGrade(cc1a.id, student.id, instId, 12, 12);
			await createExamsWithGrade(cc1b.id, student.id, instId, 12, 12);
			await createExamsWithGrade(cc2a.id, student.id, instId, 12, 12);
			await createExamsWithGrade(cc2b.id, student.id, instId, 12, 12);

			// Incomplete student with a very high partial average (UE1 only)
			const other = await createStudent({ class: klass.id });
			await createExamsWithGrade(cc1a.id, other.id, instId, 18, 18);
			await createExamsWithGrade(cc1b.id, other.id, instId, 18, 18);

			// A rule that would exclude everyone
			await admin.deliberations.rules.create({
				name: "Exclude all",
				category: "exclusion",
				programId: program.id,
				decision: "excluded",
				priority: 1,
				ruleset: {
					conditions: {
						all: [
							{
								fact: "creditsEarned",
								operator: "greaterThanInclusive",
								value: 0,
							},
						],
					},
					event: { type: "excluded" },
				},
			});

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			const result = await admin.deliberations.compute({ id: delib.id });

			const complete = result.results.find((r) => r.studentId === student.id)!;
			const incomplete = result.results.find((r) => r.studentId === other.id)!;
			expect(complete.rank).toBe(1);
			expect(complete.autoDecision).toBe("excluded");
			expect(incomplete.rank).toBeNull();
			expect(incomplete.mention).toBeNull();
			expect(incomplete.generalAverage).toBeNull();
			expect(incomplete.autoDecision).toBe("pending");
			expect(incomplete.rulesEvaluated).toHaveLength(0);
			expect(result.stats.pendingCount).toBe(1);
			expect(result.stats.classAverage).toBeCloseTo(12, 5);
		});
	});

	// -----------------------------------------------------------------------
	// Override decision
	// -----------------------------------------------------------------------

	describe("override decision", () => {
		it("overrides a student decision", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture();

			const instId = klass.institutionId;
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2a.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2b.id, student.id, instId, 12, 14);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			const computed = await admin.deliberations.compute({ id: delib.id });

			const _studentResultId = computed.results[0].studentId;

			// Find the DB result to get the actual result id
			const dbResults = await db.query.deliberationStudentResults.findMany({
				where: eq(schema.deliberationStudentResults.deliberationId, delib.id),
			});
			const resultId = dbResults[0].id;

			const overridden = await admin.deliberations.overrideDecision({
				deliberationId: delib.id,
				studentResultId: resultId,
				finalDecision: "excluded",
				reason: "Test override",
			});

			expect(overridden.finalDecision).toBe("excluded");
			expect(overridden.isOverridden).toBe(true);

			// Choosing the computed decision again restores it
			const restored = await admin.deliberations.overrideDecision({
				deliberationId: delib.id,
				studentResultId: resultId,
				finalDecision: dbResults[0].autoDecision ?? "admitted",
				reason: "Back to computed",
			});
			expect(restored.finalDecision).toBe(dbResults[0].autoDecision);
			expect(restored.isOverridden).toBe(false);
			expect(restored.mention).toBe(dbResults[0].mention);

			// Stored stats follow the final decisions
			const after = await admin.deliberations.getById({ id: delib.id });
			expect(after.stats?.admittedCount).toBe(1);
		});
	});

	// -----------------------------------------------------------------------
	// Promote admitted
	// -----------------------------------------------------------------------

	describe("promoteAdmitted", () => {
		it("rejects promotion when deliberation is not closed/signed", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await setupDeliberationFixture();

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});

			// Still in draft — should fail
			await expect(
				admin.deliberations.promoteAdmitted({
					deliberationId: delib.id,
					targetClassId: klass.id,
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("promotes admitted students to target class", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				targetClass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
			});

			const instId = klass.institutionId;

			// Good grades → admitted
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2a.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2b.id, student.id, instId, 12, 14);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			await admin.deliberations.compute({ id: delib.id });
			await admin.deliberations.transition({ id: delib.id, action: "close" });

			const result = await admin.deliberations.promoteAdmitted({
				deliberationId: delib.id,
				targetClassId: targetClass.id,
			});

			expect(result.promotedCount).toBe(1);

			// Verify student was moved to target class
			const updatedStudent = await db.query.students.findFirst({
				where: eq(schema.students.id, student.id),
			});
			expect(updatedStudent!.class).toBe(targetClass.id);

			// Verify old enrollment closed
			const enrollments = await db.query.enrollments.findMany({
				where: eq(schema.enrollments.studentId, student.id),
			});
			const activeEnrollments = enrollments.filter(
				(e) => e.status === "active",
			);
			expect(activeEnrollments).toHaveLength(1);
			expect(activeEnrollments[0].classId).toBe(targetClass.id);
			// The new enrollment belongs to the target class's year; the
			// deliberated year keeps its (completed) enrollment.
			expect(activeEnrollments[0].academicYearId).toBe(
				targetClass.academicYear,
			);
			const previous = enrollments.find((e) => e.classId === klass.id);
			expect(previous?.status).toBe("completed");

			// Promoting twice does not duplicate enrollments
			const again = await admin.deliberations.promoteAdmitted({
				deliberationId: delib.id,
				targetClassId: targetClass.id,
			});
			expect(again.promotedCount).toBe(0);
			expect(again.alreadyPromotedCount).toBe(1);
			const afterTwice = await db.query.enrollments.findMany({
				where: eq(schema.enrollments.studentId, student.id),
			});
			expect(afterTwice).toHaveLength(enrollments.length);

			const detail = await admin.deliberations.getById({ id: delib.id });
			expect(detail.promotion?.promotedCount).toBe(1);
		});

		it("rejects promotion when no admitted students", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				targetClass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
				coefficients: [1, 1, 1, 1],
			});

			const instId = klass.institutionId;

			// All bad grades → deferred
			await createExamsWithGrade(cc1a.id, student.id, instId, 3, 4);
			await createExamsWithGrade(cc1b.id, student.id, instId, 4, 5);
			await createExamsWithGrade(cc2a.id, student.id, instId, 3, 4);
			await createExamsWithGrade(cc2b.id, student.id, instId, 4, 5);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			await admin.deliberations.compute({ id: delib.id });
			await admin.deliberations.transition({ id: delib.id, action: "close" });

			await expect(
				admin.deliberations.promoteAdmitted({
					deliberationId: delib.id,
					targetClassId: targetClass.id,
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("also promotes compensated students", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				targetClass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
				coefficients: [1, 1, 1, 1],
			});

			const instId = klass.institutionId;

			// UE1: very high → ADM, UE2: below 8 → AJ (not compensable)
			// This produces "compensated" decision (avg >= 10, but UE below bar)
			await createExamsWithGrade(cc1a.id, student.id, instId, 18, 19);
			await createExamsWithGrade(cc1b.id, student.id, instId, 17, 18);
			await createExamsWithGrade(cc2a.id, student.id, instId, 4, 5);
			await createExamsWithGrade(cc2b.id, student.id, instId, 5, 6);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			const computed = await admin.deliberations.compute({ id: delib.id });

			expect(computed.results[0].autoDecision).toBe("compensated");

			await admin.deliberations.transition({ id: delib.id, action: "close" });

			const result = await admin.deliberations.promoteAdmitted({
				deliberationId: delib.id,
				targetClassId: targetClass.id,
			});

			expect(result.promotedCount).toBe(1);
		});
	});

	describe("promoteAdmitted — every decision group", () => {
		it("places repeaters, withdraws excluded students and leaves undecided ones untouched", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				targetClass,
				l1,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student: admitted,
			} = await setupDeliberationFixture();
			const instId = klass.institutionId;
			await createExamsWithGrade(cc1a.id, admitted.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, admitted.id, instId, 10, 12);
			await createExamsWithGrade(cc2a.id, admitted.id, instId, 10, 12);
			await createExamsWithGrade(cc2b.id, admitted.id, instId, 12, 14);
			const repeater = await createStudent({ class: klass.id });
			const deferred = await createStudent({ class: klass.id });
			const excluded = await createStudent({ class: klass.id });
			const undecided = await createStudent({ class: klass.id });

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			await admin.deliberations.compute({ id: delib.id });
			await admin.deliberations.transition({ id: delib.id, action: "close" });
			const decide = (studentId: string, decision: string | null) =>
				db
					.update(schema.deliberationStudentResults)
					.set({ finalDecision: decision as any })
					.where(eq(schema.deliberationStudentResults.studentId, studentId));
			await decide(repeater.id, "repeat");
			await decide(deferred.id, "deferred");
			await decide(excluded.id, "excluded");
			await decide(undecided.id, "pending");

			// The same-level class of the target year is created in place
			const repeatTarget = await admin.classes.createPromotionTarget({
				sourceClassId: klass.id,
				targetAcademicYearId: targetClass.academicYear,
				level: "same",
			});
			expect(repeatTarget.created).toBe(true);
			expect(repeatTarget.klass.cycleLevelId).toBe(l1.id);
			const targets = await admin.classes.promoTargets({
				sourceClassId: klass.id,
				targetAcademicYearId: targetClass.academicYear,
			});
			expect(targets.sameLevelClasses.map((c) => c.id)).toEqual([
				repeatTarget.klass.id,
			]);

			// A class of the wrong level is refused for repeaters
			await expect(
				admin.deliberations.promoteAdmitted({
					deliberationId: delib.id,
					targetClassId: targetClass.id,
					repeatClassId: targetClass.id,
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");

			const result = await admin.deliberations.promoteAdmitted({
				deliberationId: delib.id,
				targetClassId: targetClass.id,
				repeatClassId: repeatTarget.klass.id,
			});
			expect(result).toMatchObject({
				promotedCount: 1,
				repeatCount: 2,
				excludedCount: 1,
				undecidedCount: 1,
				repeatUnplacedCount: 0,
			});

			const enrollmentsOf = (studentId: string) =>
				db.query.enrollments.findMany({
					where: eq(schema.enrollments.studentId, studentId),
				});
			for (const sid of [repeater.id, deferred.id]) {
				const rows = await enrollmentsOf(sid);
				expect(
					rows.find((e) => e.academicYearId === academicYear.id)?.status,
				).toBe("completed");
				const next = rows.find(
					(e) => e.academicYearId === targetClass.academicYear,
				);
				expect(next?.classId).toBe(repeatTarget.klass.id);
				expect(next?.status).toBe("active");
			}
			const excludedRows = await enrollmentsOf(excluded.id);
			expect(excludedRows).toHaveLength(1);
			expect(excludedRows[0].status).toBe("withdrawn");
			const undecidedRows = await enrollmentsOf(undecided.id);
			expect(undecidedRows).toHaveLength(1);
			expect(undecidedRows[0].status).toBe("active");

			const detail = await admin.deliberations.getById({ id: delib.id });
			expect(detail.promotion).toMatchObject({
				promotedCount: 1,
				repeatCount: 2,
				excludedCount: 1,
				undecidedCount: 1,
			});

			// Running it again changes nothing
			const again = await admin.deliberations.promoteAdmitted({
				deliberationId: delib.id,
				targetClassId: targetClass.id,
				repeatClassId: repeatTarget.klass.id,
			});
			expect(again).toMatchObject({
				promotedCount: 0,
				alreadyPromotedCount: 1,
				repeatCount: 0,
				alreadyRepeatingCount: 2,
				excludedCount: 0,
			});
			expect(await enrollmentsOf(repeater.id)).toHaveLength(2);

			// A transition plan generated afterwards only holds the undecided student
			const plan = await admin.academicYearTransitions.createDraft({
				sourceAcademicYearId: academicYear.id,
				targetAcademicYearId: targetClass.academicYear,
				classIds: [klass.id],
			});
			const items = await admin.academicYearTransitions.listItems({
				transitionId: plan.id,
			});
			expect(items.items.map((i) => i.studentId)).toEqual([undecided.id]);
		});

		it("leaves repeaters in place when no repeat class is given", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				targetClass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student: admitted,
			} = await setupDeliberationFixture();
			const instId = klass.institutionId;
			await createExamsWithGrade(cc1a.id, admitted.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, admitted.id, instId, 10, 12);
			await createExamsWithGrade(cc2a.id, admitted.id, instId, 10, 12);
			await createExamsWithGrade(cc2b.id, admitted.id, instId, 12, 14);
			const repeater = await createStudent({ class: klass.id });
			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			await admin.deliberations.compute({ id: delib.id });
			await admin.deliberations.transition({ id: delib.id, action: "close" });
			await db
				.update(schema.deliberationStudentResults)
				.set({ finalDecision: "repeat" })
				.where(eq(schema.deliberationStudentResults.studentId, repeater.id));

			const result = await admin.deliberations.promoteAdmitted({
				deliberationId: delib.id,
				targetClassId: targetClass.id,
			});
			expect(result.promotedCount).toBe(1);
			expect(result.repeatUnplacedCount).toBe(1);
			const rows = await db.query.enrollments.findMany({
				where: eq(schema.enrollments.studentId, repeater.id),
			});
			expect(rows).toHaveLength(1);
			expect(rows[0].status).toBe("active");
		});
	});

	describe("workflows.cohortAnalytics", () => {
		it("uses the class's deliberation of its year and has no figures without one", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				targetClass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture();
			const instId = klass.institutionId;
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2a.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2b.id, student.id, instId, 12, 14);
			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			await admin.deliberations.compute({ id: delib.id });
			await admin.deliberations.transition({ id: delib.id, action: "close" });
			await admin.deliberations.promoteAdmitted({
				deliberationId: delib.id,
				targetClassId: targetClass.id,
			});

			const [source] = await admin.workflows.cohortAnalytics({
				classId: klass.id,
			});
			expect(source.successRate).toBe(100);
			expect(source.avgGeneral).toBeGreaterThan(10);
			expect(source.gradingProgress).toBe(100);

			// The new class has no deliberation and no exam yet: no figures,
			// even though its student was deliberated in the previous class.
			const [target] = await admin.workflows.cohortAnalytics({
				classId: targetClass.id,
			});
			expect(target.successRate).toBeNull();
			expect(target.avgGeneral).toBeNull();
			expect(target.gradingProgress).toBeNull();
			expect(target.totalStudents).toBe(1);
		});
	});

	describe("classes.createPromotionTarget", () => {
		it("creates the next-level class of the target year once, with a generated code and name", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { klass, l2, academicYear } = await setupDeliberationFixture();
			const laterYear = await createAcademicYear({
				name: "2031-2032",
				startDate: "2031-09-01",
				endDate: "2032-07-31",
			});

			const targets = await admin.classes.promoTargets({
				sourceClassId: klass.id,
			});
			expect(targets.availableYears.map((y) => y.id)).not.toContain(
				academicYear.id,
			);
			expect(targets.nextLevel?.id).toBe(l2.id);

			const first = await admin.classes.createPromotionTarget({
				sourceClassId: klass.id,
				targetAcademicYearId: laterYear.id,
			});
			expect(first.created).toBe(true);
			expect(first.klass.cycleLevelId).toBe(l2.id);
			expect(first.klass.academicYear).toBe(laterYear.id);
			expect(first.klass.code).toContain("L2");
			expect(first.klass.name).toContain(l2.name);

			const second = await admin.classes.createPromotionTarget({
				sourceClassId: klass.id,
				targetAcademicYearId: laterYear.id,
			});
			expect(second.created).toBe(false);
			expect(second.klass.id).toBe(first.klass.id);
		});
	});

	// -----------------------------------------------------------------------
	// Logs
	// -----------------------------------------------------------------------

	describe("logs", () => {
		it("logs compute, transitions, and promotion events", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				targetClass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
			});

			const instId = klass.institutionId;
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2a.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2b.id, student.id, instId, 12, 14);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });
			await admin.deliberations.compute({ id: delib.id });
			await admin.deliberations.transition({ id: delib.id, action: "close" });

			await admin.deliberations.promoteAdmitted({
				deliberationId: delib.id,
				targetClassId: targetClass.id,
			});

			const { items: logs } = await admin.deliberations.getLogs({
				deliberationId: delib.id,
			});

			const actions = logs.map((l: any) => l.action);
			expect(actions).toContain("created");
			expect(actions).toContain("opened");
			expect(actions).toContain("computed");
			expect(actions).toContain("closed");
			expect(actions).toContain("promoted");
		});
	});

	// -----------------------------------------------------------------------
	// Compute — UeResult shape
	// -----------------------------------------------------------------------

	// -----------------------------------------------------------------------
	// Custom grade scale (JVL-43)
	// -----------------------------------------------------------------------

	describe("compute — custom grade scale (JVL-43)", () => {
		it("uses institution custom scale for mention assignment", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({ ue1Credits: 6, ue2Credits: 4 });

			const instId = klass.institutionId;

			// Custom scale: passThreshold=12, "excellent" starts at 14 (default is 18).
			// Scores averaging ~15 → default scale → "bien" (14+)
			//                     → custom scale  → "excellent" (14+, but key is "excellent" in custom)
			// This proves the custom thresholds are used, not the defaults.
			await gradeScalesService.upsert(instId, {
				passThreshold: 12,
				compensationThreshold: 10,
				mentionRanges: [
					{
						key: "excellent",
						label: "Excellent",
						labelEn: "Excellent",
						gradeLetter: "A",
						min: 14,
					},
					{
						key: "passable",
						label: "Passable",
						labelEn: "Satisfactory",
						gradeLetter: "E",
						min: 12,
					},
				],
			});

			// Grades produce avg ~15: with default scale → "bien"; with custom → "excellent"
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16); // ~15.2
			await createExamsWithGrade(cc1b.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc2a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc2b.id, student.id, instId, 14, 16);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });

			const result = await admin.deliberations.compute({ id: delib.id });
			const sr = result.results[0];

			// passThreshold=12 → avg ~15.2 is admitted
			expect(sr.finalDecision).toBe("admitted");
			// Custom "excellent" threshold is 14; default "excellent" is 18.
			// If we got "excellent" here, the custom scale was used (not the default).
			expect(sr.mention).toBe("excellent");
		});
	});

	describe("compute — UE result shape", () => {
		it("ueResults contain creditsEarned field", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				classCourses: { cc1a, cc1b, cc2a, cc2b },
				student,
			} = await setupDeliberationFixture({
				ue1Credits: 6,
				ue2Credits: 4,
			});

			const instId = klass.institutionId;
			await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
			await createExamsWithGrade(cc1b.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2a.id, student.id, instId, 10, 12);
			await createExamsWithGrade(cc2b.id, student.id, instId, 12, 14);

			const delib = await admin.deliberations.create({
				classId: klass.id,
				academicYearId: academicYear.id,
				type: "annual",
			});
			await admin.deliberations.transition({ id: delib.id, action: "open" });

			const result = await admin.deliberations.compute({ id: delib.id });
			const sr = result.results[0];

			for (const ue of sr.ueResults) {
				expect(ue).toHaveProperty("creditsEarned");
				expect(ue).toHaveProperty("decision");
				expect(["ADM", "CMP", "AJ", "INC"]).toContain(ue.decision);
			}
		});
	});
});

describe("deliberations.listPaged", () => {
	it("returns { items, total, pageCount }", async () => {
		const ctx = await adminWithRealProfile();
		const caller = createCaller(ctx);
		const result = await caller.deliberations.listPaged({
			page: 1,
			pageSize: 25,
		});
		expect(result).toMatchObject({
			items: expect.any(Array),
			total: expect.any(Number),
			pageCount: expect.any(Number),
		});
	});

	it("filters by classId and academicYearId", async () => {
		const { klass, academicYear } = await setupDeliberationFixture();
		const ctx = await adminWithRealProfile();
		const admin = createCaller(ctx);

		await admin.deliberations.create({
			classId: klass.id,
			academicYearId: academicYear.id,
			type: "annual",
		});

		const result = await admin.deliberations.listPaged({
			page: 1,
			pageSize: 25,
			classId: klass.id,
			academicYearId: academicYear.id,
		});
		expect(result.items.length).toBeGreaterThanOrEqual(1);
		expect(result.total).toBeGreaterThanOrEqual(1);
		expect(result.items.every((d) => d.classId === klass.id)).toBe(true);
	});

	it("respects pageSize — returns at most pageSize items", async () => {
		const ctx = await adminWithRealProfile();
		const admin = createCaller(ctx);
		const result = await admin.deliberations.listPaged({
			page: 1,
			pageSize: 1,
		});
		expect(result.items.length).toBeLessThanOrEqual(1);
	});

	it("is refused to students (deliberation results are staff-only)", async () => {
		const profile = await createDomainUser();
		const ctx = makeTestContext({
			role: "student",
			profileOverrides: { id: profile.id },
		});
		const caller = createCaller(ctx);
		await expect(
			caller.deliberations.listPaged({ page: 1, pageSize: 25 }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});
});
