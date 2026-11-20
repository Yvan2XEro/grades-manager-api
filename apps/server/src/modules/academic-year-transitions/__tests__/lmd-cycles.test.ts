import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(180_000);

import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	createAcademicYear,
	createClass,
	createCycleLevel,
	createProgram,
	createStudent,
	createStudyCycle,
} from "@/lib/test-utils";
import {
	adminContext,
	caller,
	curriculum,
	enrollmentsOf,
	gradeCourse,
} from "./journey-helpers";

/*
 * LMD: a Licence graduate continues in Master 1 the next year, then a Master
 * graduate starts a Doctorat. Each cycle is its own program, so leaving the
 * last level of a cycle is a graduation, and joining the next cycle is a new
 * enrollment of the same student (same person, same registration number).
 */

type Api = ReturnType<typeof caller>;

async function lmdStructure(institutionId: string) {
	const cycle = async (code: string, levels: string[]) => {
		const c = await createStudyCycle({
			institutionId,
			code: `${code}-${crypto.randomUUID().slice(0, 4)}`,
		});
		const ls = [];
		for (const [i, levelCode] of levels.entries()) {
			ls.push(
				await createCycleLevel({
					cycleId: c.id,
					orderIndex: i + 1,
					code: levelCode,
					name: levelCode,
				}),
			);
		}
		const program = await createProgram({
			institutionId,
			cycleId: c.id,
			name: `${code} Informatique ${crypto.randomUUID().slice(0, 4)}`,
		});
		return { cycle: c, levels: ls, program };
	};
	return {
		licence: await cycle("LIC", ["L1", "L2", "L3"]),
		master: await cycle("MAS", ["M1", "M2"]),
		doctorat: await cycle("DOC", ["D1", "D2", "D3"]),
	};
}

async function closedJury(api: Api, classId: string, academicYearId: string) {
	const jury = await api.deliberations.create({
		classId,
		academicYearId,
		type: "annual",
	});
	await api.deliberations.transition({ id: jury.id, action: "open" });
	const computed = await api.deliberations.compute({ id: jury.id });
	await api.deliberations.transition({ id: jury.id, action: "close" });
	await api.deliberations.transition({ id: jury.id, action: "sign" });
	return { jury, computed };
}

async function years(institutionId: string, count: number) {
	const start = 2200 + Math.floor(Math.random() * 700);
	const out = [];
	for (let i = 0; i < count; i++) {
		out.push(
			await createAcademicYear({
				institutionId,
				name: `${start + i}-${start + i + 1}-lmd`,
				startDate: `${start + i}-09-01`,
				endDate: `${start + i + 1}-06-30`,
			}),
		);
	}
	return out;
}

describe("LMD: from one cycle to the next", () => {
	it("graduates the Licence, enrolls the graduate in Master 1, then Doctorat", async () => {
		const admin = await adminContext();
		const api = caller(admin);
		const institutionId = admin.institution.id;
		const { licence, master, doctorat } = await lmdStructure(institutionId);
		const [yearA, yearB, yearC, yearD] = await years(institutionId, 4);
		const [, , l3] = licence.levels;
		const [m1, m2] = master.levels;
		const [d1] = doctorat.levels;

		// --- Year A: Licence 3 jury --------------------------------------------
		const l3A = await createClass({
			program: licence.program.id,
			academicYear: yearA.id,
			cycleLevelId: l3.id,
		});
		const [ueL1, ueL2] = await curriculum(licence.program.id, l3A.id);
		const goesOn = await createStudent({ class: l3A.id });
		const stops = await createStudent({ class: l3A.id });
		const fails = await createStudent({ class: l3A.id });
		for (const ue of [ueL1, ueL2]) {
			await gradeCourse(ue.id, institutionId, [
				{ studentId: goesOn.id, cc: 14, ex: 15 },
				{ studentId: stops.id, cc: 12, ex: 11 },
				{ studentId: fails.id, cc: 5, ex: 4 },
			]);
		}
		const { jury: juryL3, computed } = await closedJury(api, l3A.id, yearA.id);
		const decision = (id: string) =>
			computed.results.find((r) => r.studentId === id)?.autoDecision;
		expect(decision(goesOn.id)).toBe("admitted");
		expect(decision(stops.id)).toBe("admitted");
		expect(decision(fails.id)).toBe("deferred");

		// Graduation check: the admitted students earned 10 of the Licence's
		// 180 credits (only the L3 year is on record) — flagged, not blocked.
		const credits = await api.classes.graduationCredits({
			deliberationId: juryL3.id,
		});
		expect(credits.cycle?.totalCreditsRequired).toBe(180);
		expect(
			credits.students.map((s) => [s.studentId, s.creditsEarned]).sort(),
		).toEqual(
			[
				[goesOn.id, 10],
				[stops.id, 10],
			].sort(),
		);
		expect(credits.students.every((s) => s.belowRequired)).toBe(true);

		// L3 is the last level of the Licence: no next level, no promotion class.
		const targets = await api.classes.promoTargets({
			sourceClassId: l3A.id,
			targetAcademicYearId: yearB.id,
		});
		expect(targets.isLastLevel).toBe(true);
		expect(targets.nextLevel).toBeNull();
		await expect(
			api.classes.createPromotionTarget({
				sourceClassId: l3A.id,
				targetAcademicYearId: yearB.id,
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");

		// The jury page graduates the admitted students; the failing one repeats L3.
		const { klass: l3B } = await api.classes.createPromotionTarget({
			sourceClassId: l3A.id,
			targetAcademicYearId: yearB.id,
			level: "same",
		});
		const outcome = await api.deliberations.promoteAdmitted({
			deliberationId: juryL3.id,
			repeatClassId: l3B.id,
		});
		expect(outcome).toMatchObject({
			graduated: true,
			promotedCount: 2,
			repeatCount: 1,
		});
		for (const s of [goesOn, stops]) {
			const rows = await enrollmentsOf(s.id);
			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({ classId: l3A.id, status: "graduated" });
		}

		// A Licence diploma can be issued to the graduates, not to the repeater.
		const optionsAfterL3 = await api.academicDocuments.studentOptions({
			studentId: goesOn.id,
		});
		expect(optionsAfterL3.diploma.eligible).toBe(true);
		const optionsFails = await api.academicDocuments.studentOptions({
			studentId: fails.id,
		});
		expect(optionsFails.diploma.eligible).toBe(false);

		// --- Year B: the graduate joins Master 1 (another program) -------------
		const m1B = await createClass({
			program: master.program.id,
			academicYear: yearB.id,
			cycleLevelId: m1.id,
		});
		const before = await api.students.getById({ id: goesOn.id });
		const moved = await api.students.update({ id: goesOn.id, classId: m1B.id });
		expect(moved.id).toBe(goesOn.id);
		expect(moved.registrationNumber).toBe(before.registrationNumber);
		expect(moved.class).toBe(m1B.id);
		const afterMove = await enrollmentsOf(goesOn.id);
		expect(afterMove).toHaveLength(2);
		// The Licence year keeps its outcome: graduated.
		expect(afterMove.find((r) => r.academicYearId === yearA.id)).toMatchObject({
			classId: l3A.id,
			status: "graduated",
		});
		expect(afterMove.find((r) => r.academicYearId === yearB.id)).toMatchObject({
			classId: m1B.id,
			status: "active",
		});
		// Still eligible for the Licence diploma once in Master.
		const optionsInM1 = await api.academicDocuments.studentOptions({
			studentId: goesOn.id,
		});
		expect(optionsInM1.diploma.eligible).toBe(true);

		// The Master 1 jury only sees Master marks and Master credits.
		const [ueM1, ueM2] = await curriculum(master.program.id, m1B.id, [8, 7]);
		for (const ue of [ueM1, ueM2]) {
			await gradeCourse(ue.id, institutionId, [
				{ studentId: goesOn.id, cc: 13, ex: 13 },
			]);
		}
		const { jury: juryM1, computed: computedM1 } = await closedJury(
			api,
			m1B.id,
			yearB.id,
		);
		expect(computedM1.results.map((r) => r.studentId)).toEqual([goesOn.id]);
		const m1Row = computedM1.results[0];
		expect(m1Row.autoDecision).toBe("admitted");
		expect(Number(m1Row.totalCreditsEarned)).toBe(15);
		expect(Number(m1Row.totalCreditsPossible)).toBe(15);

		// Two years of results, each under its own program.
		const optionsM1 = await api.academicDocuments.studentOptions({
			studentId: goesOn.id,
		});
		expect(
			optionsM1.transcript.years.map((y) => y.academicYearId).sort(),
		).toEqual([yearA.id, yearB.id].sort());
		const yearAResults = await api.profiles.results({
			profileId: before.domainUserId,
			academicYearId: yearA.id,
		});
		const yearBResults = await api.profiles.results({
			profileId: before.domainUserId,
			academicYearId: yearB.id,
		});
		expect(yearAResults.results?.class?.id).toBe(l3A.id);
		expect(yearAResults.results?.enrollmentStatus).toBe("graduated");
		expect(yearAResults.results?.totalCreditsPossible).toBe(10);
		expect(yearBResults.results?.class?.id).toBe(m1B.id);
		expect(yearBResults.results?.totalCreditsPossible).toBe(15);
		// The Licence year names what the graduate earned.
		expect(yearAResults.results?.class?.programName).toBe(licence.program.name);
		// The student's home page shows the current class's marks only.
		const m1Marks = await api.grades.consolidatedByStudent({
			studentId: goesOn.id,
			classId: m1B.id,
		});
		expect(m1Marks.units.map((u) => u.credits).sort()).toEqual([7, 8]);
		const allMarks = await api.grades.consolidatedByStudent({
			studentId: goesOn.id,
		});
		expect(allMarks.units).toHaveLength(4);

		// --- Year C: M1 → M2 inside the Master cycle ---------------------------
		const m1Targets = await api.classes.promoTargets({
			sourceClassId: m1B.id,
			targetAcademicYearId: yearC.id,
		});
		expect(m1Targets.isLastLevel).toBe(false);
		expect(m1Targets.nextLevel?.id).toBe(m2.id);
		const { klass: m2C } = await api.classes.createPromotionTarget({
			sourceClassId: m1B.id,
			targetAcademicYearId: yearC.id,
		});
		expect(m2C.program).toBe(master.program.id);
		expect(m2C.cycleLevelId).toBe(m2.id);
		// M2's courses exist before the promotion: promoted students take them.
		const [ueM2a] = await curriculum(master.program.id, m2C.id, [30]);
		await api.deliberations.promoteAdmitted({
			deliberationId: juryM1.id,
			targetClassId: m2C.id,
		});
		const m2Courses = await db.query.studentCourseEnrollments.findMany({
			where: eq(schema.studentCourseEnrollments.studentId, goesOn.id),
		});
		expect(m2Courses.filter((e) => e.academicYearId === yearC.id)).toHaveLength(
			1,
		);
		await gradeCourse(ueM2a.id, institutionId, [
			{ studentId: goesOn.id, cc: 15, ex: 15 },
		]);
		const { jury: juryM2 } = await closedJury(api, m2C.id, yearC.id);
		// Master credits add up over M1 and M2 (15 + 30), Licence ones don't count.
		const masterCredits = await api.classes.graduationCredits({
			deliberationId: juryM2.id,
		});
		expect(masterCredits.students).toHaveLength(1);
		expect(masterCredits.students[0].creditsEarned).toBe(45);
		const m2Targets = await api.classes.promoTargets({
			sourceClassId: m2C.id,
			targetAcademicYearId: yearD.id,
		});
		expect(m2Targets.isLastLevel).toBe(true);
		await api.deliberations.promoteAdmitted({ deliberationId: juryM2.id });

		// --- Year D: the Master graduate starts a Doctorat ---------------------
		const d1D = await createClass({
			program: doctorat.program.id,
			academicYear: yearD.id,
			cycleLevelId: d1.id,
		});
		await api.students.update({ id: goesOn.id, classId: d1D.id });
		const history = await enrollmentsOf(goesOn.id);
		const statusByYear = Object.fromEntries(
			history.map((r) => [r.academicYearId, [r.classId, r.status]]),
		);
		expect(statusByYear).toEqual({
			[yearA.id]: [l3A.id, "graduated"],
			[yearB.id]: [m1B.id, "completed"],
			[yearC.id]: [m2C.id, "graduated"],
			[yearD.id]: [d1D.id, "active"],
		});
		const student = await db.query.students.findFirst({
			where: eq(schema.students.id, goesOn.id),
		});
		expect(student?.class).toBe(d1D.id);
		// One person, one student record across the three cycles.
		const records = await db.query.students.findMany({
			where: eq(schema.students.domainUserId, before.domainUserId),
		});
		expect(records).toHaveLength(1);

		// The student who stopped after the Licence is not in any later year.
		expect(await enrollmentsOf(stops.id)).toHaveLength(1);
	});

	it("the year transition plan graduates the Licence and can send graduates on to Master 1", async () => {
		const admin = await adminContext();
		const api = caller(admin);
		const institutionId = admin.institution.id;
		const { licence, master } = await lmdStructure(institutionId);
		const [yearA, yearB] = await years(institutionId, 2);
		const l3A = await createClass({
			program: licence.program.id,
			academicYear: yearA.id,
			cycleLevelId: licence.levels[2].id,
		});
		const m1B = await createClass({
			program: master.program.id,
			academicYear: yearB.id,
			cycleLevelId: master.levels[0].id,
		});
		const [ue1, ue2] = await curriculum(licence.program.id, l3A.id);
		const s1 = await createStudent({ class: l3A.id });
		const s2 = await createStudent({ class: l3A.id });
		for (const ue of [ue1, ue2]) {
			await gradeCourse(ue.id, institutionId, [
				{ studentId: s1.id, cc: 14, ex: 14 },
				{ studentId: s2.id, cc: 12, ex: 12 },
			]);
		}
		await closedJury(api, l3A.id, yearA.id);

		const plan = await api.academicYearTransitions.createDraft({
			sourceAcademicYearId: yearA.id,
			targetAcademicYearId: yearB.id,
			classIds: [l3A.id],
			deferredOutcome: "review",
		});
		expect(plan.summary).toMatchObject({ total: 2, graduate: 2, blocked: 0 });

		// The first-year classes of the other cycles are offered to graduates.
		const targets = await api.classes.promoTargets({
			sourceClassId: l3A.id,
			targetAcademicYearId: yearB.id,
		});
		expect(targets.isLastLevel).toBe(true);
		expect(targets.nextCycleClasses.map((c) => c.id)).toContain(m1B.id);

		// s1 continues in Master 1: graduate from the Licence *and* join M1.
		const items = await api.academicYearTransitions.listItems({
			transitionId: plan.id,
			limit: 50,
		});
		const itemOf = (id: string) => items.items.find((i) => i.studentId === id)!;
		await api.academicYearTransitions.resolveItems({
			transitionId: plan.id,
			itemIds: [itemOf(s1.id).id],
			outcome: "graduate",
			targetClassId: m1B.id,
			reason: "Admitted to Master 1",
		});
		await api.academicYearTransitions.submit({ id: plan.id });
		await api.academicYearTransitions.approve({ id: plan.id });
		const done = await api.academicYearTransitions.execute({ id: plan.id });
		expect(done.status).toBe("completed");

		const s1Rows = await enrollmentsOf(s1.id);
		expect(s1Rows.find((r) => r.academicYearId === yearA.id)?.status).toBe(
			"graduated",
		);
		expect(s1Rows.find((r) => r.academicYearId === yearB.id)).toMatchObject({
			classId: m1B.id,
			status: "active",
		});
		const s2Rows = await enrollmentsOf(s2.id);
		expect(s2Rows).toHaveLength(1);
		expect(s2Rows[0].status).toBe("graduated");
	});
});
