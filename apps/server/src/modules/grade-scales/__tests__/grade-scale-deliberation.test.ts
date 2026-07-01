import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(30_000);

import { db } from "@/db";
import { exams, grades } from "@/db/schema/app-schema";
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
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

async function adminWithRealProfile() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

async function setupSimpleDeliberationFixture() {
	const program = await createProgram();
	const cycle = await createStudyCycle({
		institutionId: program.institutionId,
	});
	const level = await createCycleLevel({
		cycleId: cycle.id,
		orderIndex: 1,
		code: "L1",
	});
	const academicYear = await createAcademicYear({
		name: `TEST-${Math.random().toString(36).slice(2, 8)}`,
		startDate: "2024-09-01",
		endDate: "2025-07-31",
	});
	const klass = await createClass({
		program: program.id,
		academicYear: academicYear.id,
		cycleLevelId: level.id,
	});
	const classRecord = await db.query.classes.findFirst({
		where: (c, { eq }) => eq(c.id, klass.id),
	});
	const semesterId = classRecord!.semesterId!;

	const ue = await createTeachingUnit({ programId: program.id, credits: 6 });
	const course = await createCourse({
		program: program.id,
		teachingUnitId: ue.id,
	});
	const cc = await createClassCourse({
		class: klass.id,
		course: course.id,
		coefficient: "1",
		semesterId,
	});

	const student = await createStudent({ class: klass.id });
	await ensureStudentCourseEnrollment(student.id, cc.id, "active");

	return {
		program,
		academicYear,
		klass,
		ue,
		cc,
		student,
		institutionId: klass.institutionId,
	};
}

async function insertGrade(
	classCourseId: string,
	studentId: string,
	institutionId: string,
	score: number,
) {
	const [exam] = await db
		.insert(exams)
		.values({
			name: `EX-${Math.random().toString(36).slice(2, 8)}`,
			type: "EXAMEN",
			date: new Date(),
			percentage: "100",
			classCourse: classCourseId,
			status: "approved",
			isLocked: false,
			scheduledAt: new Date(),
			validatedAt: new Date(),
			institutionId,
		})
		.returning();
	await db.insert(grades).values({
		student: studentId,
		exam: exam.id,
		score: score.toString(),
	});
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("grade scale — deliberation integration", () => {
	it("regression: default scale (threshold=10) — score 11 → admitted", async () => {
		const ctx = await adminWithRealProfile();
		const admin = createCaller(ctx);
		const { academicYear, klass, cc, student, institutionId } =
			await setupSimpleDeliberationFixture();

		// No custom scale inserted — service falls back to DEFAULT_MENTION_RANGES / threshold=10
		await insertGrade(cc.id, student.id, institutionId, 11);

		const delib = await admin.deliberations.create({
			classId: klass.id,
			academicYearId: academicYear.id,
			type: "annual",
		});
		await admin.deliberations.transition({ id: delib.id, action: "open" });

		const result = await admin.deliberations.compute({ id: delib.id });
		const sr = result.results[0];

		expect(sr.autoDecision).toBe("admitted");
		expect(Number(sr.generalAverage)).toBeCloseTo(11, 1);
	});

	it("custom passThreshold=12 — score 11 → deferred (not admitted)", async () => {
		const ctx = await adminWithRealProfile();
		const admin = createCaller(ctx);
		const { academicYear, klass, cc, student, institutionId } =
			await setupSimpleDeliberationFixture();

		// Set custom passThreshold=12 for this institution
		await admin.gradeScales.upsert({
			passThreshold: 12,
			compensationThreshold: 9,
			mentionRanges: [
				{
					key: "passable",
					label: "Passable",
					labelEn: "Pass",
					gradeLetter: "E",
					min: 12,
				},
				{
					key: "bien",
					label: "Bien",
					labelEn: "Good",
					gradeLetter: "C",
					min: 14,
				},
			],
		});

		await insertGrade(cc.id, student.id, institutionId, 11);

		const delib = await admin.deliberations.create({
			classId: klass.id,
			academicYearId: academicYear.id,
			type: "annual",
		});
		await admin.deliberations.transition({ id: delib.id, action: "open" });

		const result = await admin.deliberations.compute({ id: delib.id });
		const sr = result.results[0];

		expect(sr.autoDecision).toBe("deferred");
		expect(Number(sr.generalAverage)).toBeCloseTo(11, 1);
	});

	it("custom passThreshold=12 — score 13 → admitted", async () => {
		const ctx = await adminWithRealProfile();
		const admin = createCaller(ctx);
		const { academicYear, klass, cc, student, institutionId } =
			await setupSimpleDeliberationFixture();

		await admin.gradeScales.upsert({
			passThreshold: 12,
			compensationThreshold: 9,
			mentionRanges: [
				{
					key: "passable",
					label: "Passable",
					labelEn: "Pass",
					gradeLetter: "E",
					min: 12,
				},
				{
					key: "bien",
					label: "Bien",
					labelEn: "Good",
					gradeLetter: "C",
					min: 14,
				},
			],
		});

		await insertGrade(cc.id, student.id, institutionId, 13);

		const delib = await admin.deliberations.create({
			classId: klass.id,
			academicYearId: academicYear.id,
			type: "annual",
		});
		await admin.deliberations.transition({ id: delib.id, action: "open" });

		const result = await admin.deliberations.compute({ id: delib.id });
		const sr = result.results[0];

		expect(sr.autoDecision).toBe("admitted");
	});

	it("custom mentionRanges — mention key matches custom range, not default", async () => {
		const ctx = await adminWithRealProfile();
		const admin = createCaller(ctx);
		const { academicYear, klass, cc, student, institutionId } =
			await setupSimpleDeliberationFixture();

		// Use a custom range with a non-standard key at min=15
		await admin.gradeScales.upsert({
			passThreshold: 10,
			compensationThreshold: 8,
			mentionRanges: [
				{
					key: "mention_custom",
					label: "Mention Spéciale",
					labelEn: "Special Mention",
					gradeLetter: "S",
					min: 15,
				},
				{
					key: "recu",
					label: "Reçu",
					labelEn: "Passed",
					gradeLetter: "P",
					min: 10,
				},
			],
		});

		await insertGrade(cc.id, student.id, institutionId, 17);

		const delib = await admin.deliberations.create({
			classId: klass.id,
			academicYearId: academicYear.id,
			type: "annual",
		});
		await admin.deliberations.transition({ id: delib.id, action: "open" });

		const result = await admin.deliberations.compute({ id: delib.id });
		const sr = result.results[0];

		expect(sr.autoDecision).toBe("admitted");
		// biome-ignore lint/suspicious/noExplicitAny: custom mention key outside the built-in enum
		expect((sr as any).mention).toBe("mention_custom");
	});

	it("score below all custom ranges → mention is null", async () => {
		const ctx = await adminWithRealProfile();
		const admin = createCaller(ctx);
		const { academicYear, klass, cc, student, institutionId } =
			await setupSimpleDeliberationFixture();

		await admin.gradeScales.upsert({
			passThreshold: 10,
			compensationThreshold: 8,
			mentionRanges: [
				{
					key: "recu",
					label: "Reçu",
					labelEn: "Passed",
					gradeLetter: "P",
					min: 12,
				},
			],
		});

		// Score 11 → admitted (threshold=10) but below the lowest mention range (min=12)
		await insertGrade(cc.id, student.id, institutionId, 11);

		const delib = await admin.deliberations.create({
			classId: klass.id,
			academicYearId: academicYear.id,
			type: "annual",
		});
		await admin.deliberations.transition({ id: delib.id, action: "open" });

		const result = await admin.deliberations.compute({ id: delib.id });
		const sr = result.results[0];

		expect(sr.autoDecision).toBe("admitted");
		expect(sr.mention).toBeNull();
	});
});
