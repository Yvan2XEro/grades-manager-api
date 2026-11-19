import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(120_000);

import { and, eq } from "drizzle-orm";
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
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

/*
 * One cohort across two academic years, through the public procedures only:
 * the jury of year 1, the next year, the promotion of the admitted students,
 * the year transition for the others (repeaters), the switch of the active
 * year, then the jury of year 2 and the graduation of the final level.
 */

const caller = (ctx: Context) => appRouter.createCaller(ctx);

async function adminContext() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

let examSeq = 0;
/** One CC (40%) and one final exam (60%) for a class course; scores per student. */
async function gradeCourse(
	classCourseId: string,
	institutionId: string,
	scores: Array<{ studentId: string; cc: number; ex: number }>,
) {
	const exams = await db
		.insert(schema.exams)
		.values(
			(["CC", "EXAMEN"] as const).map((type) => ({
				name: `${type}-${++examSeq}`,
				type,
				date: new Date(),
				percentage: type === "CC" ? "40" : "60",
				classCourse: classCourseId,
				status: "approved" as const,
				isLocked: false,
				scheduledAt: new Date(),
				validatedAt: new Date(),
				institutionId,
			})),
		)
		.returning();
	const [cc, ex] = exams;
	if (scores.length === 0) return;
	await db.insert(schema.grades).values(
		scores.flatMap((s) => [
			{ student: s.studentId, exam: cc.id, score: s.cc.toString() },
			{ student: s.studentId, exam: ex.id, score: s.ex.toString() },
		]),
	);
}

/** Two UEs (6 + 4 credits), one course each, attached to a class. */
async function curriculum(programId: string, classId: string) {
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, classId),
	});
	const ues = [];
	for (const credits of [6, 4]) {
		const ue = await createTeachingUnit({ programId, credits });
		const course = await createCourse({
			program: programId,
			teachingUnitId: ue.id,
		});
		ues.push(
			await createClassCourse({
				class: classId,
				course: course.id,
				coefficient: "1",
				semesterId: klass!.semesterId!,
			}),
		);
	}
	return ues;
}

async function enrollmentsOf(studentId: string) {
	return db.query.enrollments.findMany({
		where: eq(schema.enrollments.studentId, studentId),
	});
}

describe("a cohort across two academic years", () => {
	it("deliberates, opens the next year, promotes, keeps repeaters, then graduates", async () => {
		const admin = await adminContext();
		const superAdmin = makeTestContext({ role: "super_admin" });
		const api = caller(admin);
		const institutionId = admin.institution.id;

		// --- Structure: a 2-level cycle (L1 → L2, L2 is the final level) -----
		const cycle = await createStudyCycle({ institutionId });
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
		const program = await createProgram({ institutionId, cycleId: cycle.id });
		// Year names are unique per institution: pick a year no other test uses.
		const startYear = 2200 + Math.floor(Math.random() * 700);
		const yearA = await createAcademicYear({
			institutionId,
			name: `${startYear}-${startYear + 1}`,
			startDate: `${startYear}-09-01`,
			endDate: `${startYear + 1}-06-30`,
		});
		const l1A = await createClass({
			program: program.id,
			academicYear: yearA.id,
			cycleLevelId: l1.id,
		});
		const [ue1A, ue2A] = await curriculum(program.id, l1A.id);

		const admitted = await createStudent({ class: l1A.id });
		const compensated = await createStudent({ class: l1A.id });
		const deferred = await createStudent({ class: l1A.id });
		const incomplete = await createStudent({ class: l1A.id });

		await gradeCourse(ue1A.id, institutionId, [
			{ studentId: admitted.id, cc: 14, ex: 14 },
			{ studentId: compensated.id, cc: 18, ex: 17 },
			{ studentId: deferred.id, cc: 4, ex: 4 },
			{ studentId: incomplete.id, cc: 15, ex: 15 },
		]);
		await gradeCourse(ue2A.id, institutionId, [
			{ studentId: admitted.id, cc: 13, ex: 13 },
			{ studentId: compensated.id, cc: 4, ex: 5 },
			{ studentId: deferred.id, cc: 5, ex: 5 },
			// `incomplete` has no grade in UE 2
		]);

		// --- 1. Jury of year A ----------------------------------------------
		const juryA = await api.deliberations.create({
			classId: l1A.id,
			academicYearId: yearA.id,
			type: "annual",
		});
		await api.deliberations.transition({ id: juryA.id, action: "open" });
		const computed = await api.deliberations.compute({ id: juryA.id });
		const decisionOf = (studentId: string) =>
			computed.results.find((r) => r.studentId === studentId);
		expect(computed.results).toHaveLength(4);
		expect(decisionOf(admitted.id)?.autoDecision).toBe("admitted");
		expect(decisionOf(compensated.id)?.autoDecision).toBe("compensated");
		expect(decisionOf(deferred.id)?.autoDecision).toBe("deferred");
		expect(decisionOf(incomplete.id)?.autoDecision).toBe("pending");
		expect(decisionOf(incomplete.id)?.rank ?? null).toBeNull();

		// The jury makes the incomplete student repeat the year.
		const stored = await api.deliberations.getById({ id: juryA.id });
		const incompleteRow = stored.studentResults.find(
			(r) => r.studentId === incomplete.id,
		);
		await api.deliberations.overrideDecision({
			deliberationId: juryA.id,
			studentResultId: incompleteRow!.id,
			finalDecision: "repeat",
			reason: "Missed the final exams; repeats the year",
		});
		await api.deliberations.transition({ id: juryA.id, action: "close" });
		await api.deliberations.transition({ id: juryA.id, action: "sign" });

		// --- 2. Next academic year ------------------------------------------
		const yearB = await api.academicYears.createNextYear({
			sourceYearId: yearA.id,
		});
		expect(yearB.name).toBe(`${startYear + 1}-${startYear + 2}`);
		expect(new Date(yearB.startDate).toISOString().slice(0, 10)).toBe(
			`${startYear + 1}-09-01`,
		);
		expect(new Date(yearB.endDate).toISOString().slice(0, 10)).toBe(
			`${startYear + 2}-06-30`,
		);
		// Asking twice must not create a second year (or fail with a raw DB error).
		await expect(
			api.academicYears.createNextYear({ sourceYearId: yearA.id }),
		).rejects.toHaveProperty("code", "CONFLICT");

		// --- 3. Promotion of the admitted students --------------------------
		const targets = await api.classes.promoTargets({ sourceClassId: l1A.id });
		expect(targets.nextLevel?.id).toBe(l2.id);
		expect(targets.availableYears.map((y) => y.id)).toContain(yearB.id);
		const { klass: l2B } = await api.classes.createPromotionTarget({
			sourceClassId: l1A.id,
			targetAcademicYearId: yearB.id,
		});
		expect(l2B.cycleLevelId).toBe(l2.id);
		expect(l2B.academicYear).toBe(yearB.id);

		const promotion = await api.deliberations.promoteAdmitted({
			deliberationId: juryA.id,
			targetClassId: l2B.id,
		});
		expect(promotion.promotedCount).toBe(2);
		const again = await api.deliberations.promoteAdmitted({
			deliberationId: juryA.id,
			targetClassId: l2B.id,
		});
		expect(again).toMatchObject({ promotedCount: 0, alreadyPromotedCount: 2 });

		for (const s of [admitted, compensated]) {
			const rows = await enrollmentsOf(s.id);
			expect(rows).toHaveLength(2);
			expect(rows.find((r) => r.academicYearId === yearA.id)).toMatchObject({
				classId: l1A.id,
				status: "completed",
			});
			expect(rows.find((r) => r.academicYearId === yearB.id)).toMatchObject({
				classId: l2B.id,
				status: "active",
			});
		}
		// The others are still in year A, waiting for the year transition.
		for (const s of [deferred, incomplete]) {
			const rows = await enrollmentsOf(s.id);
			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({
				academicYearId: yearA.id,
				status: "active",
			});
		}

		// --- 4. Year transition for the students left in year A -------------
		const l1B = await createClass({
			program: program.id,
			academicYear: yearB.id,
			cycleLevelId: l1.id,
			programOptionId: l1A.programOptionId,
		});
		const plan = await api.academicYearTransitions.createDraft({
			sourceAcademicYearId: yearA.id,
			targetAcademicYearId: yearB.id,
			classIds: [l1A.id],
			deferredOutcome: "repeat",
		});
		// Already-promoted students are not in the plan.
		expect(plan.summary).toMatchObject({ total: 2, repeat: 2, blocked: 0 });
		await api.academicYearTransitions.submit({ id: plan.id });
		await api.academicYearTransitions.approve({ id: plan.id });
		const done = await api.academicYearTransitions.execute({ id: plan.id });
		expect(done.status).toBe("completed");

		for (const s of [deferred, incomplete]) {
			const rows = await enrollmentsOf(s.id);
			expect(rows).toHaveLength(2);
			expect(rows.find((r) => r.academicYearId === yearB.id)).toMatchObject({
				classId: l1B.id,
				status: "active",
			});
			const student = await db.query.students.findFirst({
				where: eq(schema.students.id, s.id),
			});
			expect(student?.class).toBe(l1B.id);
		}
		// Every student of the cohort has exactly one place in year B.
		const yearBRows = await db.query.enrollments.findMany({
			where: and(
				eq(schema.enrollments.academicYearId, yearB.id),
				eq(schema.enrollments.status, "active"),
			),
		});
		const cohort = [admitted, compensated, deferred, incomplete].map(
			(s) => s.id,
		);
		expect(yearBRows.filter((r) => cohort.includes(r.studentId)).length).toBe(
			4,
		);

		// --- 5. Switch the active year --------------------------------------
		await caller(superAdmin).academicYears.setActive({
			id: yearB.id,
			isActive: true,
		});
		const years = await api.academicYears.list({});
		const active = years.items.filter(
			(y) => y.isActive && (y.id === yearA.id || y.id === yearB.id),
		);
		expect(active.map((y) => y.id)).toEqual([yearB.id]);

		// Year A's jury still shows the whole cohort with its decisions.
		const juryAAfter = await api.deliberations.getById({ id: juryA.id });
		expect(juryAAfter.status).toBe("signed");
		expect(juryAAfter.studentResults).toHaveLength(4);
		const l1AStudents = await db.query.enrollments.findMany({
			where: and(
				eq(schema.enrollments.classId, l1A.id),
				eq(schema.enrollments.academicYearId, yearA.id),
			),
		});
		expect(l1AStudents).toHaveLength(4);

		// --- 6. Jury of year B in the final level: only L2 students ---------
		const [ue1B, ue2B] = await curriculum(program.id, l2B.id);
		await gradeCourse(ue1B.id, institutionId, [
			{ studentId: admitted.id, cc: 12, ex: 12 },
			{ studentId: compensated.id, cc: 11, ex: 12 },
		]);
		await gradeCourse(ue2B.id, institutionId, [
			{ studentId: admitted.id, cc: 13, ex: 12 },
			{ studentId: compensated.id, cc: 12, ex: 11 },
		]);
		const juryB = await api.deliberations.create({
			classId: l2B.id,
			academicYearId: yearB.id,
			type: "annual",
		});
		await api.deliberations.transition({ id: juryB.id, action: "open" });
		const computedB = await api.deliberations.compute({ id: juryB.id });
		expect(computedB.results.map((r) => r.studentId).sort()).toEqual(
			[admitted.id, compensated.id].sort(),
		);
		// Year B averages come from year B grades only.
		const avgB = computedB.results.find((r) => r.studentId === admitted.id);
		expect(Number(avgB?.generalAverage)).toBeGreaterThan(11.9);
		expect(Number(avgB?.generalAverage)).toBeLessThan(12.6);
		expect(computedB.results.every((r) => r.autoDecision === "admitted")).toBe(
			true,
		);
		await api.deliberations.transition({ id: juryB.id, action: "close" });

		// Final level: no target class means graduation.
		await api.deliberations.promoteAdmitted({ deliberationId: juryB.id });
		for (const s of [admitted, compensated]) {
			const rows = await enrollmentsOf(s.id);
			expect(rows.find((r) => r.academicYearId === yearB.id)?.status).toBe(
				"graduated",
			);
		}
		// The repeaters are untouched by the L2 jury.
		for (const s of [deferred, incomplete]) {
			const rows = await enrollmentsOf(s.id);
			expect(rows.find((r) => r.academicYearId === yearB.id)?.status).toBe(
				"active",
			);
		}
	});
});

describe("the two promotion paths together", () => {
	it("a plan drafted before the jury's promotion still executes", async () => {
		const admin = await adminContext();
		const api = caller(admin);
		const institutionId = admin.institution.id;
		const cycle = await createStudyCycle({ institutionId });
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
		const program = await createProgram({ institutionId, cycleId: cycle.id });
		const startYear = 2200 + Math.floor(Math.random() * 700);
		const yearA = await createAcademicYear({
			institutionId,
			name: `${startYear}-${startYear + 1}-p`,
			startDate: `${startYear}-09-01`,
			endDate: `${startYear + 1}-06-30`,
		});
		const yearB = await createAcademicYear({
			institutionId,
			name: `${startYear + 1}-${startYear + 2}-p`,
			startDate: `${startYear + 1}-09-01`,
			endDate: `${startYear + 2}-06-30`,
		});
		const l1A = await createClass({
			program: program.id,
			academicYear: yearA.id,
			cycleLevelId: l1.id,
		});
		const l2B = await createClass({
			program: program.id,
			academicYear: yearB.id,
			cycleLevelId: l2.id,
			programOptionId: l1A.programOptionId,
		});
		const [ue1, ue2] = await curriculum(program.id, l1A.id);
		const s1 = await createStudent({ class: l1A.id });
		const s2 = await createStudent({ class: l1A.id });
		for (const ue of [ue1, ue2]) {
			await gradeCourse(ue.id, institutionId, [
				{ studentId: s1.id, cc: 14, ex: 14 },
				{ studentId: s2.id, cc: 12, ex: 12 },
			]);
		}
		const jury = await api.deliberations.create({
			classId: l1A.id,
			academicYearId: yearA.id,
			type: "annual",
		});
		await api.deliberations.transition({ id: jury.id, action: "open" });
		await api.deliberations.compute({ id: jury.id });
		await api.deliberations.transition({ id: jury.id, action: "close" });
		await api.deliberations.transition({ id: jury.id, action: "sign" });

		// The registrar drafts and approves the year plan…
		const plan = await api.academicYearTransitions.createDraft({
			sourceAcademicYearId: yearA.id,
			targetAcademicYearId: yearB.id,
			classIds: [l1A.id],
			deferredOutcome: "review",
		});
		expect(plan.summary).toMatchObject({ total: 2, promote: 2, blocked: 0 });
		await api.academicYearTransitions.submit({ id: plan.id });
		await api.academicYearTransitions.approve({ id: plan.id });
		// …while the dean promotes from the jury page.
		await api.deliberations.promoteAdmitted({
			deliberationId: jury.id,
			targetClassId: l2B.id,
		});

		const done = await api.academicYearTransitions.execute({ id: plan.id });
		expect(done.status).toBe("completed");
		for (const s of [s1, s2]) {
			const rows = await enrollmentsOf(s.id);
			expect(rows.filter((r) => r.academicYearId === yearB.id)).toHaveLength(1);
		}
	});
});
