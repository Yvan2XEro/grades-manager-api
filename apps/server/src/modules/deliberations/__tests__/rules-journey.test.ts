import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(180_000);

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
	gradeCourse,
} from "../../academic-year-transitions/__tests__/journey-helpers";

/*
 * A jury decided by the institution's own rules (json-rules-engine), as a
 * director of studies would set them up:
 *   1. average below 7 → repeat
 *   2. a UE below 8 → deferred
 *   3. average ≥ 10, at most one failed UE → compensated
 *   4. every UE validated → admitted
 *   5. already made to repeat twice → excluded
 * plus a rule scoped to another level, a disabled rule and a retake-only rule
 * that must not apply.
 */

type Api = ReturnType<typeof caller>;

const cond = (fact: string, operator: string, value: unknown) => ({
	fact,
	operator,
	value,
});
const ruleset = (all: ReturnType<typeof cond>[], message: string) => ({
	conditions: { all },
	event: { type: "decision", params: { message } },
});

async function institutionRules(
	api: Api,
	programId: string,
	otherLevelId: string,
) {
	const create = api.deliberations.rules.create;
	await create({
		name: "Average below 7",
		category: "repeat",
		decision: "repeat",
		programId,
		priority: 1,
		ruleset: ruleset(
			[cond("overallAverage", "lessThan", 7)],
			"General average below 7",
		),
	});
	await create({
		name: "UE below 8",
		category: "deferral",
		decision: "deferred",
		programId,
		priority: 1,
		ruleset: ruleset(
			[cond("lowestUnitAverage", "lessThan", 8)],
			"A UE is below 8",
		),
	});
	await create({
		name: "Compensation",
		category: "compensation",
		decision: "compensated",
		programId,
		priority: 1,
		ruleset: ruleset(
			[
				cond("overallAverage", "greaterThanInclusive", 10),
				cond("failedTeachingUnitsCount", "equal", 1),
			],
			"Average ≥ 10 with one failed UE",
		),
	});
	await create({
		name: "All UEs validated",
		category: "admission",
		decision: "admitted",
		programId,
		priority: 1,
		ruleset: ruleset(
			[cond("failedTeachingUnitsCount", "equal", 0)],
			"Every UE validated",
		),
	});
	await create({
		name: "Third failing year",
		category: "exclusion",
		decision: "excluded",
		programId,
		priority: 1,
		ruleset: ruleset(
			[
				cond("consecutiveRepeats", "greaterThanInclusive", 2),
				cond("overallAverage", "lessThan", 10),
			],
			"Failed again after repeating twice",
		),
	});
	// Must not apply: another level, disabled, retake juries only.
	await create({
		name: "Final year: exclude below 12",
		category: "exclusion",
		decision: "excluded",
		programId,
		cycleLevelId: otherLevelId,
		priority: 0,
		ruleset: ruleset([cond("overallAverage", "lessThan", 12)], "Final year"),
	});
	await create({
		name: "Disabled: exclude everyone",
		category: "exclusion",
		decision: "excluded",
		programId,
		priority: 0,
		isActive: false,
		ruleset: ruleset([cond("overallAverage", "greaterThan", -1)], "Off"),
	});
	await create({
		name: "Retake session only",
		category: "exclusion",
		decision: "excluded",
		programId,
		deliberationType: "retake",
		priority: 0,
		ruleset: ruleset([cond("overallAverage", "greaterThan", -1)], "Retake"),
	});
}

async function jury(api: Api, classId: string, academicYearId: string) {
	const delib = await api.deliberations.create({
		classId,
		academicYearId,
		type: "annual",
	});
	await api.deliberations.transition({ id: delib.id, action: "open" });
	return delib;
}

describe("a jury decided by the institution's rules", () => {
	it("applies the rules in cascade, with their scope, and explains each decision", async () => {
		const admin = await adminContext();
		const api = caller(admin);
		const institutionId = admin.institution.id;
		const cycle = await createStudyCycle({ institutionId });
		const l2 = await createCycleLevel({
			cycleId: cycle.id,
			orderIndex: 1,
			code: "L2",
		});
		const l3 = await createCycleLevel({
			cycleId: cycle.id,
			orderIndex: 2,
			code: "L3",
		});
		const program = await createProgram({ institutionId, cycleId: cycle.id });
		const start = 2200 + Math.floor(Math.random() * 700);
		const years = [];
		for (let i = 0; i < 3; i++) {
			years.push(
				await createAcademicYear({
					institutionId,
					name: `${start + i}-${start + i + 1}-rules`,
					startDate: `${start + i}-09-01`,
					endDate: `${start + i + 1}-06-30`,
				}),
			);
		}
		await institutionRules(api, program.id, l3.id);

		// --- Two earlier years: one student repeats L2 twice ------------------
		let previousClassId: string | null = null;
		const twice = await (async () => {
			const firstClass = await createClass({
				program: program.id,
				academicYear: years[0].id,
				cycleLevelId: l2.id,
			});
			return {
				student: await createStudent({ class: firstClass.id }),
				firstClass,
			};
		})();
		for (const [i, year] of years.slice(0, 2).entries()) {
			const klass =
				i === 0
					? twice.firstClass
					: await createClass({
							program: program.id,
							academicYear: year.id,
							cycleLevelId: l2.id,
							programOptionId: twice.firstClass.programOptionId,
						});
			if (i > 0) {
				await api.students.update({ id: twice.student.id, classId: klass.id });
			}
			for (const ue of await curriculum(program.id, klass.id)) {
				await gradeCourse(ue.id, institutionId, [
					{ studentId: twice.student.id, cc: 5, ex: 5 },
				]);
			}
			const past = await jury(api, klass.id, year.id);
			const computed = await api.deliberations.compute({ id: past.id });
			expect(computed.results[0].autoDecision).toBe("repeat");
			await api.deliberations.transition({ id: past.id, action: "close" });
			previousClassId = klass.id;
		}
		expect(previousClassId).not.toBeNull();

		// --- The year being deliberated ---------------------------------------
		const klass = await createClass({
			program: program.id,
			academicYear: years[2].id,
			cycleLevelId: l2.id,
			programOptionId: twice.firstClass.programOptionId,
		});
		await api.students.update({ id: twice.student.id, classId: klass.id });
		const ues = await curriculum(program.id, klass.id, [6, 4, 5]);
		const allPass = await createStudent({ class: klass.id });
		const oneFailed = await createStudent({ class: klass.id });
		const lowUe = await createStudent({ class: klass.id });
		const weak = await createStudent({ class: klass.id });
		// Per UE (6, 4 and 5 credits): CC = exam = the UE average.
		const marks: Array<[string, number[]]> = [
			[allPass.id, [14, 13, 12]], // all validated → admitted
			[oneFailed.id, [13, 9, 12]], // 11.6, one UE at 9 → compensated
			[lowUe.id, [15, 6, 13]], // 11.9 but a UE at 6 → deferred
			[weak.id, [5, 6, 6]], // 5.6 → repeat
			[twice.student.id, [9, 8, 9]], // 8.7 after two repeats → excluded
		];
		for (const [i, ue] of ues.entries()) {
			await gradeCourse(
				ue.id,
				institutionId,
				marks.map(([studentId, scores]) => ({
					studentId,
					cc: scores[i],
					ex: scores[i],
				})),
			);
		}
		const current = await jury(api, klass.id, years[2].id);
		const computed = await api.deliberations.compute({ id: current.id });
		const row = (id: string) =>
			computed.results.find((r) => r.studentId === id)!;

		expect(row(allPass.id).autoDecision).toBe("admitted");
		expect(row(oneFailed.id).autoDecision).toBe("compensated");
		expect(row(lowUe.id).autoDecision).toBe("deferred");
		expect(row(weak.id).autoDecision).toBe("repeat");
		expect(row(twice.student.id).autoDecision).toBe("excluded");

		// Each decision says which rule made it, and why.
		const matched = (id: string) =>
			(row(id).rulesEvaluated ?? []).filter((t) => t.matched);
		expect(matched(oneFailed.id).map((t) => t.ruleName)).toEqual([
			"Compensation",
		]);
		expect(matched(twice.student.id)[0]).toMatchObject({
			ruleName: "Third failing year",
			reasons: ["Failed again after repeating twice"],
		});
		expect(row(twice.student.id).factsSnapshot).toMatchObject({
			consecutiveRepeats: 2,
			previousDeliberationDecision: "repeat",
		});
		// The out-of-scope rules were never evaluated.
		const evaluatedNames = new Set(
			computed.results.flatMap((r) =>
				(r.rulesEvaluated ?? []).map((t) => t.ruleName),
			),
		);
		for (const name of [
			"Final year: exclude below 12",
			"Disabled: exclude everyone",
			"Retake session only",
		]) {
			expect(evaluatedNames.has(name)).toBe(false);
		}

		// --- Editing a rule and computing again changes the decisions --------
		const rules = await api.deliberations.rules.list({ programId: program.id });
		const compensation = rules.items.find(
			(r) => r.name === "Compensation" && r.programId === program.id,
		)!;
		await api.deliberations.rules.update({
			id: compensation.id,
			ruleset: ruleset(
				[
					cond("overallAverage", "greaterThanInclusive", 12),
					cond("failedTeachingUnitsCount", "equal", 1),
				],
				"Average ≥ 12 with one failed UE",
			),
		});
		const recomputed = await api.deliberations.compute({ id: current.id });
		const after = recomputed.results.find((r) => r.studentId === oneFailed.id)!;
		// 11.6 no longer compensates and no other rule matches: the jury decides.
		expect((after.rulesEvaluated ?? []).some((t) => t.matched)).toBe(false);
		expect(after.autoDecision).toBe("pending");

		// --- The jury overrides one decision ----------------------------------
		const stored = await api.deliberations.getById({ id: current.id });
		const lowRow = stored.studentResults.find((r) => r.studentId === lowUe.id)!;
		await api.deliberations.overrideDecision({
			deliberationId: current.id,
			studentResultId: lowRow.id,
			finalDecision: "compensated",
			reason: "Medical certificate for the UE exam",
		});
		const afterOverride = await api.deliberations.getById({ id: current.id });
		const overridden = afterOverride.studentResults.find(
			(r) => r.studentId === lowUe.id,
		)!;
		expect(overridden).toMatchObject({
			autoDecision: "deferred",
			finalDecision: "compensated",
			isOverridden: true,
		});
		// Computing again keeps the jury's decision.
		await api.deliberations.compute({ id: current.id });
		const afterRecompute = await api.deliberations.getById({ id: current.id });
		expect(
			afterRecompute.studentResults.find((r) => r.studentId === lowUe.id),
		).toMatchObject({
			autoDecision: "deferred",
			finalDecision: "compensated",
			isOverridden: true,
			overrideReason: "Medical certificate for the UE exam",
		});
	});

	it("rejects a rule that uses an unknown fact or an unknown operator", async () => {
		const admin = await adminContext();
		const api = caller(admin);
		const program = await createProgram({
			institutionId: admin.institution.id,
		});
		const base = {
			name: "Typo",
			category: "repeat" as const,
			decision: "repeat" as const,
			programId: program.id,
		};
		await expect(
			api.deliberations.rules.create({
				...base,
				ruleset: ruleset([cond("overalAverage", "lessThan", 7)], "typo"),
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
		await expect(
			api.deliberations.rules.create({
				...base,
				ruleset: ruleset([cond("overallAverage", "below", 7)], "typo"),
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
		await expect(
			api.deliberations.rules.create({
				...base,
				ruleset: { conditions: { all: [] } },
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});
});
