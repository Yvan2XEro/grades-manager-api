import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	type ExamWithRetake,
	normalizeExamType,
	resolveStudentGradesWithRetakes,
} from "../exports/template-helper";
import type {
	DeliberationCourseResult,
	DeliberationUeResult,
	UeDecision,
} from "./deliberations.types";

/**
 * The grade computation of a jury, shared by the deliberation compute, the
 * transcript and the student file: course average = exams weighted by their
 * percentages (CC × p + EX × p), UE average = courses weighted by their
 * coefficients, general average = UEs weighted by their credits, then LMD
 * inter-UE compensation. One formula everywhere, so a transcript always
 * agrees with the jury.
 */

export type UeCourseInput = {
	id: string;
	code: string;
	name: string;
	coefficient: number;
	semesterId: string | null;
	exams: ExamWithRetake[];
};

export type UeInput = {
	id: string;
	code: string;
	name: string;
	credits: number;
	courses: UeCourseInput[];
};

type ClassCourseRow = {
	coefficient: string | number | null;
	semesterId: string | null;
	courseRef: {
		id: string;
		code: string;
		name: string;
		teachingUnit: { id: string; code: string; name: string; credits: number };
	};
	exams: Array<{
		id: string;
		type: string;
		percentage: string | number;
		sessionType: string | null;
		parentExamId: string | null;
		scoringPolicy: string | null;
		grades: Array<{ student: string; score: string | null }>;
	}>;
};

/** Groups the class courses (with exams and grades) by teaching unit. */
export function buildUeInputs(classCourses: ClassCourseRow[]): UeInput[] {
	const ueMap = new Map<string, UeInput>();
	for (const cc of classCourses) {
		const ue = cc.courseRef.teachingUnit;
		let entry = ueMap.get(ue.id);
		if (!entry) {
			entry = {
				id: ue.id,
				code: ue.code,
				name: ue.name,
				credits: ue.credits,
				courses: [],
			};
			ueMap.set(ue.id, entry);
		}
		const exams = (cc.exams || []).map((exam) => ({
			id: exam.id,
			type: exam.type,
			percentage: Number(exam.percentage),
			sessionType: exam.sessionType || "normal",
			parentExamId: exam.parentExamId || null,
			scoringPolicy: exam.scoringPolicy || "replace",
			grades: (exam.grades || []).map((grade) => ({
				studentRef: { id: grade.student },
				score: grade.score,
			})),
		})) as ExamWithRetake[];
		entry.courses.push({
			id: cc.courseRef.id,
			code: cc.courseRef.code,
			name: cc.courseRef.name,
			coefficient: Number(cc.coefficient) || 1,
			semesterId: cc.semesterId ?? null,
			exams,
		});
	}
	return Array.from(ueMap.values());
}

export type StudentUeComputation = {
	ueResults: DeliberationUeResult[];
	/** Credit-weighted average, also when results are incomplete (partial). */
	average: number | null;
	allComplete: boolean;
	incompleteUECount: number;
	totalCreditsEarned: number;
	totalCreditsPossible: number;
};

/** Course average from the resolved exam marks (CC × p + EX × p). */
function courseAverage(
	resolved: ReturnType<typeof resolveStudentGradesWithRetakes>,
) {
	const cc = resolved.find((r) => normalizeExamType(r.type) === "CC");
	const ex = resolved.find((r) => normalizeExamType(r.type) === "EXAMEN");
	let average: number | null = null;
	if (cc && ex && cc.score !== null && ex.score !== null) {
		average = (cc.score * cc.percentage + ex.score * ex.percentage) / 100;
	} else if (resolved.length > 0) {
		// Only one exam type: weighted mean of the available marks
		const withScores = resolved.filter((r) => r.score !== null);
		if (withScores.length > 0) {
			const totalPerc = withScores.reduce((sum, r) => sum + r.percentage, 0);
			if (totalPerc > 0) {
				average =
					withScores.reduce(
						(sum, r) => sum + (r.score ?? 0) * r.percentage,
						0,
					) / totalPerc;
			}
		}
	}
	return { cc, ex, average };
}

/** UE, credit and general-average results of one student. */
export function computeStudentUeResults(
	ues: UeInput[],
	studentId: string,
	opts: {
		includeRetakes: boolean;
		passThreshold: number;
		compensationThreshold: number;
	},
): StudentUeComputation {
	const ueResults: DeliberationUeResult[] = [];
	let totalCreditsEarned = 0;
	let totalCreditsPossible = 0;

	for (const ue of ues) {
		const courseResults: DeliberationCourseResult[] = [];
		const coursesWithGrades: Array<{ average: number; coefficient: number }> =
			[];

		for (const course of ue.courses) {
			const resolved = resolveStudentGradesWithRetakes(
				course.exams,
				studentId,
				opts.includeRetakes,
			);
			const { cc, ex, average } = courseAverage(resolved);
			courseResults.push({
				courseId: course.id,
				courseCode: course.code,
				courseName: course.name,
				coefficient: course.coefficient,
				average,
				cc: cc?.score ?? null,
				ex: ex?.score ?? null,
				ccIsRetake: cc?.isRetake ?? false,
				exIsRetake: ex?.isRetake ?? false,
			});
			if (average !== null) {
				coursesWithGrades.push({ average, coefficient: course.coefficient });
			}
		}

		// UE average: weighted by coefficient, only when every course has a mark
		const allCoursesHaveGrades = coursesWithGrades.length === ue.courses.length;
		let ueAverage: number | null = null;
		if (allCoursesHaveGrades && coursesWithGrades.length > 0) {
			const sumWeighted = coursesWithGrades.reduce(
				(sum, c) => sum + c.average * c.coefficient,
				0,
			);
			const sumCoeffs = coursesWithGrades.reduce(
				(sum, c) => sum + c.coefficient,
				0,
			);
			ueAverage = sumCoeffs > 0 ? sumWeighted / sumCoeffs : null;
		}

		const isValidated =
			allCoursesHaveGrades &&
			ueAverage !== null &&
			ueAverage >= opts.passThreshold;

		let decision: UeDecision;
		if (!allCoursesHaveGrades) decision = "INC";
		else if (isValidated) decision = "ADM";
		else decision = "AJ";

		const creditsEarned = isValidated ? ue.credits : 0;
		totalCreditsEarned += creditsEarned;
		totalCreditsPossible += ue.credits;

		ueResults.push({
			ueId: ue.id,
			ueCode: ue.code,
			ueName: ue.name,
			ueCredits: ue.credits,
			ueAverage,
			isValidated,
			isComplete: allCoursesHaveGrades,
			decision,
			creditsEarned,
			courseResults,
		});
	}

	// A student is only deliberated on complete results: every UE must have
	// a mark. Otherwise the average is partial.
	const allComplete =
		ueResults.length > 0 && ueResults.every((ue) => ue.isComplete);
	const incompleteUECount = ueResults.filter((ue) => !ue.isComplete).length;

	// General average: credit-weighted UE averages
	const uesWithAverages = ueResults.filter((ue) => ue.ueAverage !== null);
	let average: number | null = null;
	if (uesWithAverages.length > 0) {
		const totalUeCredits = uesWithAverages.reduce(
			(sum, ue) => sum + ue.ueCredits,
			0,
		);
		average =
			totalUeCredits > 0
				? uesWithAverages.reduce(
						(sum, ue) => sum + (ue.ueAverage ?? 0) * ue.ueCredits,
						0,
					) / totalUeCredits
				: uesWithAverages.reduce((sum, ue) => sum + (ue.ueAverage ?? 0), 0) /
					uesWithAverages.length;
	}

	// LMD inter-UE compensation: with a passing general average, failed UEs
	// above the compensation bar are compensated and their credits awarded.
	if (allComplete && average !== null && average >= opts.passThreshold) {
		for (const ue of ueResults) {
			if (
				ue.decision === "AJ" &&
				ue.ueAverage !== null &&
				ue.ueAverage >= opts.compensationThreshold
			) {
				ue.decision = "CMP";
				ue.isValidated = true;
				ue.creditsEarned = ue.ueCredits;
				totalCreditsEarned += ue.ueCredits;
			}
		}
	}

	return {
		ueResults,
		average,
		allComplete,
		incompleteUECount,
		totalCreditsEarned,
		totalCreditsPossible,
	};
}

export type UeSemester = { id: string; name: string; orderIndex: number };

/**
 * Loads the courses of a class (optionally one semester) with the exams and
 * the marks of the given students only, ready for `computeStudentUeResults`.
 */
export async function loadClassUeInputs(
	classId: string,
	opts: { studentIds?: string[]; semesterId?: string | null } = {},
) {
	const rows = await db.query.classCourses.findMany({
		where: opts.semesterId
			? and(
					eq(schema.classCourses.class, classId),
					eq(schema.classCourses.semesterId, opts.semesterId),
				)
			: eq(schema.classCourses.class, classId),
		with: {
			courseRef: { with: { teachingUnit: true } },
			semester: true,
			exams: {
				with: {
					grades: opts.studentIds
						? {
								where: inArray(schema.grades.student, opts.studentIds),
							}
						: true,
				},
			},
		},
	});
	/** Semester of each UE (the semester of its first course that has one). */
	const ueSemesters = new Map<string, UeSemester>();
	for (const r of rows) {
		const ueId = r.courseRef.teachingUnit.id;
		if (r.semester && !ueSemesters.has(ueId)) {
			ueSemesters.set(ueId, {
				id: r.semester.id,
				name: r.semester.name,
				orderIndex: r.semester.orderIndex,
			});
		}
	}
	return { ues: buildUeInputs(rows), ueSemesters };
}
