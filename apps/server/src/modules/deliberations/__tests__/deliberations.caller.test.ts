import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(30_000);

import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createDomainUser,
	createProgram,
	createStudent,
	createTeachingUnit,
	ensureStudentCourseEnrollment,
	makeTestContext,
} from "@/lib/test-utils";
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
	const academicYear = await createAcademicYear();
	const klass = await createClass({
		program: program.id,
		academicYear: academicYear.id,
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
		academicYear,
		klass,
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

			const studentResultId = computed.results[0].studentId;

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
				program,
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

			// Create target class
			const targetClass = await createClass({
				program: program.id,
				academicYear: academicYear.id,
			});

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
		});

		it("rejects promotion when no admitted students", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const {
				academicYear,
				klass,
				program,
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

			const targetClass = await createClass({
				program: program.id,
				academicYear: academicYear.id,
			});

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
				program,
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

			const targetClass = await createClass({
				program: program.id,
				academicYear: academicYear.id,
			});

			const result = await admin.deliberations.promoteAdmitted({
				deliberationId: delib.id,
				targetClassId: targetClass.id,
			});

			expect(result.promotedCount).toBe(1);
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
				program,
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

			const targetClass = await createClass({
				program: program.id,
				academicYear: academicYear.id,
			});
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
