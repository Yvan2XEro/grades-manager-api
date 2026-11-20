import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import type { DeliberationDecision } from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";
import type { DeliberationUeResult } from "./deliberations.types";

/**
 * Facts of the deliberated year only, from the jury's own UE results. The
 * generic student facts cover every year of the student (and every cycle:
 * a Master 1 student still has their Licence marks), so a rule on
 * `lowestUnitAverage` would otherwise see a UE failed years ago.
 */
export function yearFactsFromUeResults(
	ueResults: DeliberationUeResult[],
	totals: { creditsEarned: number; creditsPossible: number },
	scale: { passThreshold: number; compensationThreshold: number },
) {
	const { passThreshold, compensationThreshold } = scale;
	const ueAverages = ueResults
		.map((ue) => ue.ueAverage)
		.filter((v): v is number => v !== null);
	const courses = ueResults.flatMap((ue) => ue.courseResults);
	const courseAverages = courses
		.map((c) => c.average)
		.filter((v): v is number => v !== null);
	const mean = (values: number[]) =>
		values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
	const belowPass = ueAverages.filter((v) => v < passThreshold).length;

	return {
		overallAverageUnweighted: mean(ueAverages),
		averageByTeachingUnit: Object.fromEntries(
			ueResults
				.filter((ue) => ue.ueAverage !== null)
				.map((ue) => [
					ue.ueId,
					{
						average: ue.ueAverage as number,
						code: ue.ueCode,
						name: ue.ueName,
						credits: ue.ueCredits,
					},
				]),
		),
		averageByCourse: Object.fromEntries(
			courses
				.filter((c) => c.average !== null)
				.map((c) => [
					c.courseId,
					{
						average: c.average as number,
						code: c.courseCode,
						name: c.courseName,
					},
				]),
		),
		lowestUnitAverage: ueAverages.length > 0 ? Math.min(...ueAverages) : 0,
		lowestScore: courseAverages.length > 0 ? Math.min(...courseAverages) : 0,
		highestScore: courseAverages.length > 0 ? Math.max(...courseAverages) : 0,
		scoresAbove10: courseAverages.filter((v) => v >= 10).length,
		scoresBelow10: courseAverages.filter((v) => v < 10).length,
		scoresBelow8: courseAverages.filter((v) => v < 8).length,
		// Course marks under the compensation bar / compensable ones
		eliminatoryFailures: courseAverages.filter((v) => v < compensationThreshold)
			.length,
		compensableFailures: courseAverages.filter(
			(v) => v >= compensationThreshold && v < passThreshold,
		).length,
		failedCoursesCount: courseAverages.filter((v) => v < passThreshold).length,
		validatedCoursesCount: courseAverages.filter((v) => v >= passThreshold)
			.length,
		// Below the pass mark, compensated or not (the jury's `failedUECount`
		// only counts UEs that are not validated even by compensation).
		failedTeachingUnitsCount: belowPass,
		validatedUnitsCount: ueAverages.length - belowPass,
		unitValidationRate:
			ueResults.length > 0
				? ueResults.filter((ue) => ue.isValidated).length / ueResults.length
				: 0,
		creditsEarnedThisYear: totals.creditsEarned,
		creditsAttempted: totals.creditsPossible,
		requiredCredits: totals.creditsPossible,
		creditDeficit: totals.creditsPossible - totals.creditsEarned,
		creditCompletionRate:
			totals.creditsPossible > 0
				? totals.creditsEarned / totals.creditsPossible
				: 0,
	};
}

/**
 * Order of two year-end juries of the same year: a retake jury supersedes
 * the annual one, then the most recent wins. Positive when `a` is decisive.
 */
export function compareYearEndJuries(
	a: { type: string; createdAt: Date },
	b: { type: string; createdAt: Date },
) {
	const rank = (t: string) => (t === "retake" ? 1 : 0);
	return (
		rank(a.type) - rank(b.type) ||
		new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	);
}

/** Decisions that make a student do the year again. */
const REPEATING: ReadonlySet<DeliberationDecision> = new Set([
	"repeat",
	"deferred",
]);

export type JuryHistory = {
	/** Final decision of the student's last closed jury before this year. */
	previousDeliberationDecision: DeliberationDecision | null;
	/** Years in a row, just before this one, the student was made to repeat. */
	consecutiveRepeats: number;
};

/**
 * The jury history of each student before the deliberated year: one decision
 * per earlier academic year (the latest closed or signed jury of that year,
 * so a retake session supersedes the annual one), most recent year first.
 */
export async function juryHistoryBefore(
	studentIds: string[],
	academicYearId: string,
	institutionId: string,
): Promise<Map<string, JuryHistory>> {
	const history = new Map<string, JuryHistory>();
	if (studentIds.length === 0) return history;
	const current = await db.query.academicYears.findFirst({
		where: eq(schema.academicYears.id, academicYearId),
		columns: { startDate: true },
	});
	if (!current) return history;
	const rows = await db
		.select({
			studentId: schema.deliberationStudentResults.studentId,
			finalDecision: schema.deliberationStudentResults.finalDecision,
			academicYearId: schema.deliberations.academicYearId,
			startDate: schema.academicYears.startDate,
			type: schema.deliberations.type,
			createdAt: schema.deliberations.createdAt,
		})
		.from(schema.deliberationStudentResults)
		.innerJoin(
			schema.deliberations,
			eq(
				schema.deliberations.id,
				schema.deliberationStudentResults.deliberationId,
			),
		)
		.innerJoin(
			schema.academicYears,
			eq(schema.academicYears.id, schema.deliberations.academicYearId),
		)
		.where(
			and(
				eq(schema.deliberations.institutionId, institutionId),
				inArray(schema.deliberations.status, ["closed", "signed"]),
				inArray(schema.deliberations.type, ["annual", "retake"]),
				inArray(schema.deliberationStudentResults.studentId, studentIds),
			),
		);
	const before = rows.filter(
		(r) =>
			new Date(r.startDate).getTime() < new Date(current.startDate).getTime(),
	);
	// One decision per student and year: the retake jury's when the student
	// went through it (it is the year's final decision), else the latest one.
	const byStudentYear = new Map<string, (typeof before)[number]>();
	for (const row of before) {
		const key = `${row.studentId}:${row.academicYearId}`;
		const seen = byStudentYear.get(key);
		if (!seen || compareYearEndJuries(row, seen) > 0) {
			byStudentYear.set(key, row);
		}
	}
	const byStudent = new Map<string, (typeof before)[number][]>();
	for (const row of byStudentYear.values()) {
		const list = byStudent.get(row.studentId) ?? [];
		list.push(row);
		byStudent.set(row.studentId, list);
	}
	for (const [studentId, list] of byStudent) {
		list.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);
		let consecutiveRepeats = 0;
		for (const row of list) {
			if (!row.finalDecision || !REPEATING.has(row.finalDecision)) break;
			consecutiveRepeats++;
		}
		history.set(studentId, {
			previousDeliberationDecision: list[0]?.finalDecision ?? null,
			consecutiveRepeats,
		});
	}
	return history;
}
