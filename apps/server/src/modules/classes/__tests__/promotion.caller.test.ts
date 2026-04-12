import { beforeAll, describe, expect, it, setDefaultTimeout } from "bun:test";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createCycleLevel,
	createDomainUser,
	createProgram,
	createStudent,
	createStudyCycle,
	makeTestContext,
	setupTestInstitution,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

setDefaultTimeout(30_000);

const caller = (ctx: Context) => appRouter.createCaller(ctx);

// ---------------------------------------------------------------------------
// Shared fixture helpers
// ---------------------------------------------------------------------------

/**
 * Build an admin context whose profile.id exists in domain_users,
 * required for procedures that FK-reference domain_users.
 */
async function adminWithRealProfile() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

/**
 * Creates a two-level cycle (L1 → L2) linked to a program,
 * then creates classes for both levels in distinct academic years.
 *
 * Returns everything needed to exercise promotion logic:
 *   - sourceClass  : L1 class in previousYear (not active)
 *   - targetClass  : L2 class in activeYear (isActive = true)
 *   - l1 / l2      : the cycle level records
 */
async function setupPromoFixture() {
	const institution = schema.institutions ? undefined : undefined; // just to reference the type
	void institution;

	const program = await createProgram();
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

	const previousYear = await createAcademicYear({
		name: "2023-2024",
		startDate: "2023-09-01",
		endDate: "2024-07-31",
		isActive: false,
	});
	const activeYear = await createAcademicYear({
		name: "2024-2025",
		startDate: "2024-09-01",
		endDate: "2025-07-31",
		isActive: true,
	});

	const sourceClass = await createClass({
		program: program.id,
		academicYear: previousYear.id,
		cycleLevelId: l1.id,
	});
	const targetClass = await createClass({
		program: program.id,
		academicYear: activeYear.id,
		cycleLevelId: l2.id,
	});

	return {
		program,
		cycle,
		l1,
		l2,
		previousYear,
		activeYear,
		sourceClass,
		targetClass,
	};
}

/**
 * Creates a deliberation + student result directly in DB
 * (bypasses the full deliberation workflow for test brevity).
 */
async function createDeliberationResult(opts: {
	classId: string;
	academicYearId: string;
	institutionId: string;
	studentId: string;
	createdById: string;
	generalAverage?: number;
	finalDecision?: schema.DeliberationDecision;
	mention?: schema.DeliberationMention;
	totalCreditsEarned?: number;
	totalCreditsPossible?: number;
}) {
	const [delib] = await db
		.insert(schema.deliberations)
		.values({
			classId: opts.classId,
			academicYearId: opts.academicYearId,
			institutionId: opts.institutionId,
			type: "annual",
			status: "signed",
			createdBy: opts.createdById,
		})
		.returning();

	const [result] = await db
		.insert(schema.deliberationStudentResults)
		.values({
			deliberationId: delib.id,
			studentId: opts.studentId,
			generalAverage: opts.generalAverage ?? 12.5,
			totalCreditsEarned: opts.totalCreditsEarned ?? 60,
			totalCreditsPossible: opts.totalCreditsPossible ?? 60,
			autoDecision: opts.finalDecision ?? "admitted",
			finalDecision: opts.finalDecision ?? "admitted",
			mention: opts.mention ?? "bien",
			isOverridden: false,
		})
		.returning();

	return { delib, result };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

beforeAll(async () => {
	await setupTestInstitution();
});

describe("classes.promoTargets", () => {
	it("requires auth", async () => {
		const { sourceClass } = await setupPromoFixture();
		const c = caller(makeTestContext());
		await expect(
			c.classes.promoTargets({ sourceClassId: sourceClass.id }),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	it("returns eligible target classes when targetAcademicYearId is provided", async () => {
		const { sourceClass, targetClass, activeYear } = await setupPromoFixture();
		const c = caller(asAdmin());
		const { targetClasses, isLastLevel, availableYears } =
			await c.classes.promoTargets({
				sourceClassId: sourceClass.id,
				targetAcademicYearId: activeYear.id,
			});

		expect(isLastLevel).toBe(false);
		expect(availableYears.map((y) => y.id)).toContain(activeYear.id);
		const ids = targetClasses.map((tc) => tc.id);
		expect(ids).toContain(targetClass.id);
	});

	it("returns empty targetClasses when no targetAcademicYearId is provided", async () => {
		const { sourceClass } = await setupPromoFixture();
		const c = caller(asAdmin());
		const { targetClasses, availableYears } = await c.classes.promoTargets({
			sourceClassId: sourceClass.id,
		});

		// No year selected → no class results, but years list is still populated
		expect(targetClasses).toHaveLength(0);
		expect(availableYears.length).toBeGreaterThan(0);
	});

	it("marks isLastLevel=true when source class is at the last cycle level", async () => {
		const { targetClass, activeYear } = await setupPromoFixture();
		// targetClass is at L2 (last level — no L3 created)
		const c = caller(asAdmin());
		const { isLastLevel } = await c.classes.promoTargets({
			sourceClassId: targetClass.id,
			targetAcademicYearId: activeYear.id,
		});
		expect(isLastLevel).toBe(true);
	});

	it("excludes classes from other programs", async () => {
		const { sourceClass, activeYear } = await setupPromoFixture();
		// Create an unrelated class in the same year — different program
		const otherProgram = await createProgram();
		await createClass({
			program: otherProgram.id,
			academicYear: activeYear.id,
		});

		const c = caller(asAdmin());
		const { targetClasses } = await c.classes.promoTargets({
			sourceClassId: sourceClass.id,
			targetAcademicYearId: activeYear.id,
		});

		const programIds = targetClasses.map((tc) => tc.program);
		for (const pId of programIds) {
			expect(pId).toBe(sourceClass.program);
		}
	});
});

describe("classes.promotionPreview", () => {
	it("requires auth", async () => {
		const { sourceClass } = await setupPromoFixture();
		const c = caller(makeTestContext());
		await expect(
			c.classes.promotionPreview({ sourceClassId: sourceClass.id }),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	it("returns students with null deliberationResult when no deliberation exists", async () => {
		const { sourceClass } = await setupPromoFixture();
		const student = await createStudent({ class: sourceClass.id });

		const c = caller(asAdmin());
		const { items } = await c.classes.promotionPreview({
			sourceClassId: sourceClass.id,
		});

		const found = items.find((i) => i.student.id === student.id);
		expect(found).toBeDefined();
		expect(found!.deliberationResult).toBeNull();
	});

	it("returns students with deliberationResult when signed annual deliberation exists", async () => {
		const { sourceClass, activeYear } = await setupPromoFixture();
		const profile = await createDomainUser();
		const student = await createStudent({ class: sourceClass.id });

		await createDeliberationResult({
			classId: sourceClass.id,
			academicYearId: activeYear.id,
			institutionId: sourceClass.institutionId,
			studentId: student.id,
			createdById: profile.id,
			generalAverage: 14.5,
			finalDecision: "admitted",
			mention: "bien",
		});

		const c = caller(asAdmin());
		const { items } = await c.classes.promotionPreview({
			sourceClassId: sourceClass.id,
		});

		const found = items.find((i) => i.student.id === student.id);
		expect(found?.deliberationResult).not.toBeNull();
		expect(found!.deliberationResult!.finalDecision).toBe("admitted");
		expect(Number(found!.deliberationResult!.generalAverage)).toBeCloseTo(14.5);
		expect(found!.deliberationResult!.mention).toBe("bien");
	});

	it("supports pagination via cursor", async () => {
		const { sourceClass } = await setupPromoFixture();
		// Create 3 students
		await createStudent({ class: sourceClass.id });
		await createStudent({ class: sourceClass.id });
		await createStudent({ class: sourceClass.id });

		const c = caller(asAdmin());
		const page1 = await c.classes.promotionPreview({
			sourceClassId: sourceClass.id,
			limit: 2,
		});
		expect(page1.items.length).toBe(2);
		expect(page1.nextCursor).toBeDefined();

		const page2 = await c.classes.promotionPreview({
			sourceClassId: sourceClass.id,
			limit: 2,
			cursor: page1.nextCursor,
		});
		expect(page2.items.length).toBeGreaterThanOrEqual(1);
	});
});

describe("classes.bulkTransfer", () => {
	it("requires admin role", async () => {
		const { sourceClass, targetClass } = await setupPromoFixture();
		const student = await createStudent({ class: sourceClass.id });
		const c = caller(makeTestContext({ role: "student" }));
		await expect(
			c.classes.bulkTransfer({
				studentIds: [student.id],
				toClassId: targetClass.id,
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("transfers multiple students in one call", async () => {
		const { sourceClass, targetClass } = await setupPromoFixture();
		const s1 = await createStudent({ class: sourceClass.id });
		const s2 = await createStudent({ class: sourceClass.id });

		const c = caller(asAdmin());
		const result = await c.classes.bulkTransfer({
			studentIds: [s1.id, s2.id],
			toClassId: targetClass.id,
		});

		expect(result.transferred).toBe(2);

		// Students should now be in the target class
		const updatedS1 = await db.query.students.findFirst({
			where: eq(schema.students.id, s1.id),
		});
		const updatedS2 = await db.query.students.findFirst({
			where: eq(schema.students.id, s2.id),
		});
		expect(updatedS1?.class).toBe(targetClass.id);
		expect(updatedS2?.class).toBe(targetClass.id);
	});

	it("closes old enrollment with status 'completed' when source is not last level", async () => {
		const { sourceClass, targetClass } = await setupPromoFixture();
		// sourceClass is L1 (not last level)
		const student = await createStudent({ class: sourceClass.id });

		const c = caller(asAdmin());
		await c.classes.bulkTransfer({
			studentIds: [student.id],
			toClassId: targetClass.id,
		});

		const oldEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(schema.enrollments.studentId, student.id),
				eq(schema.enrollments.classId, sourceClass.id),
			),
		});
		expect(oldEnrollment?.status).toBe("completed");
	});

	it("closes old enrollment with status 'graduated' when source is last level", async () => {
		// Use targetClass (L2 = last level) as source, create any new class as destination
		const { targetClass, program, activeYear } = await setupPromoFixture();
		const anotherClass = await createClass({
			program: program.id,
			academicYear: activeYear.id,
		});
		const student = await createStudent({ class: targetClass.id });

		const c = caller(asAdmin());
		await c.classes.bulkTransfer({
			studentIds: [student.id],
			toClassId: anotherClass.id,
		});

		const oldEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(schema.enrollments.studentId, student.id),
				eq(schema.enrollments.classId, targetClass.id),
			),
		});
		expect(oldEnrollment?.status).toBe("graduated");
	});

	it("creates a new active enrollment in the target class", async () => {
		const { sourceClass, targetClass } = await setupPromoFixture();
		const student = await createStudent({ class: sourceClass.id });

		const c = caller(asAdmin());
		await c.classes.bulkTransfer({
			studentIds: [student.id],
			toClassId: targetClass.id,
		});

		const newEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(schema.enrollments.studentId, student.id),
				eq(schema.enrollments.classId, targetClass.id),
			),
		});
		expect(newEnrollment?.status).toBe("active");
	});

	it("rejects if target class does not belong to institution", async () => {
		const { sourceClass } = await setupPromoFixture();
		const student = await createStudent({ class: sourceClass.id });
		const c = caller(asAdmin());
		await expect(
			c.classes.bulkTransfer({
				studentIds: [student.id],
				toClassId: "non-existent-class-id",
			}),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});
});

describe("classes.graduatedStudents", () => {
	it("requires admin role", async () => {
		const c = caller(makeTestContext({ role: "student" }));
		await expect(c.classes.graduatedStudents({})).rejects.toHaveProperty(
			"code",
			"FORBIDDEN",
		);
	});

	it("returns students whose enrollment status is 'graduated'", async () => {
		const { targetClass, program, activeYear } = await setupPromoFixture();
		// L2 is last level — transfer from L2 → another class sets graduated
		const anotherClass = await createClass({
			program: program.id,
			academicYear: activeYear.id,
		});
		const student = await createStudent({ class: targetClass.id });

		const c = caller(asAdmin());
		await c.classes.bulkTransfer({
			studentIds: [student.id],
			toClassId: anotherClass.id,
		});

		const { items } = await c.classes.graduatedStudents({});
		const studentIds = items.map((i) => i.student?.id);
		expect(studentIds).toContain(student.id);
	});

	it("does not include students with 'completed' status", async () => {
		const { sourceClass, targetClass } = await setupPromoFixture();
		// L1 → L2 = completed, not graduated
		const student = await createStudent({ class: sourceClass.id });

		const c = caller(asAdmin());
		await c.classes.bulkTransfer({
			studentIds: [student.id],
			toClassId: targetClass.id,
		});

		const { items } = await c.classes.graduatedStudents({});
		const studentIds = items.map((i) => i.student?.id);
		expect(studentIds).not.toContain(student.id);
	});
});
