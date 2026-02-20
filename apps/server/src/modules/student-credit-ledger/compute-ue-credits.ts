import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

const DEFAULT_PASSING_GRADE = 10;

/** Status of a single UE for a student. */
export type UeValidationStatus = "validated" | "incomplete" | "failed";

export interface UeCourseDetail {
	courseId: string;
	courseCode: string;
	courseName: string;
	coefficient: number;
	average: number | null; // null = no grade yet
}

export interface UeValidationResult {
	ueId: string;
	ueCode: string;
	ueName: string;
	ueCredits: number;
	ueAverage: number | null;
	status: UeValidationStatus;
	courses: UeCourseDetail[];
}

export interface CreditComputationResult {
	ueResults: UeValidationResult[];
	creditsEarned: number;
	creditsInProgress: number;
}

/**
 * Compute credits for a student based on UE validation (LMD rules).
 *
 * For each UE the student is enrolled in:
 *  1. Fetch exam grades for each EC (course) in that UE
 *  2. Apply retake scoring policies (replace / best_of)
 *  3. Compute EC average = Σ(effective_score × exam_percentage) / 100
 *  4. Compute UE average = Σ(EC_average × coefficient) / Σ(coefficient)
 *  5. UE validated if average >= passingGrade AND all ECs have grades
 *  6. Validated → creditsEarned, Incomplete → creditsInProgress, Failed → 0
 */
export async function computeUeCredits(
	studentId: string,
	academicYearId: string,
	passingGrade = DEFAULT_PASSING_GRADE,
): Promise<CreditComputationResult> {
	// 1. Find all course enrollments for this student/year that are grade-eligible
	const enrollments = await db
		.select({
			classCourseId: schema.studentCourseEnrollments.classCourseId,
			courseId: schema.studentCourseEnrollments.courseId,
		})
		.from(schema.studentCourseEnrollments)
		.where(
			and(
				eq(schema.studentCourseEnrollments.studentId, studentId),
				eq(schema.studentCourseEnrollments.academicYearId, academicYearId),
				inArray(schema.studentCourseEnrollments.status, [
					"planned",
					"active",
					"completed",
					"failed",
				]),
			),
		);

	if (enrollments.length === 0) {
		return { ueResults: [], creditsEarned: 0, creditsInProgress: 0 };
	}

	const classCourseIds = enrollments.map((e) => e.classCourseId);

	// 2. Fetch class-course metadata: coefficient, teaching unit, course info
	const ccMeta = await db
		.select({
			classCourseId: schema.classCourses.id,
			courseId: schema.courses.id,
			courseCode: schema.courses.code,
			courseName: schema.courses.name,
			coefficient: schema.classCourses.coefficient,
			teachingUnitId: schema.teachingUnits.id,
			ueCode: schema.teachingUnits.code,
			ueName: schema.teachingUnits.name,
			ueCredits: schema.teachingUnits.credits,
		})
		.from(schema.classCourses)
		.innerJoin(
			schema.courses,
			eq(schema.classCourses.course, schema.courses.id),
		)
		.innerJoin(
			schema.teachingUnits,
			eq(schema.courses.teachingUnitId, schema.teachingUnits.id),
		)
		.where(inArray(schema.classCourses.id, classCourseIds));

	const ccMetaMap = new Map(ccMeta.map((m) => [m.classCourseId, m]));

	// 3. Fetch all grades for this student across the enrolled class-courses
	const rawGrades = await db
		.select({
			gradeScore: schema.grades.score,
			examId: schema.exams.id,
			examPercentage: schema.exams.percentage,
			examSessionType: schema.exams.sessionType,
			examParentId: schema.exams.parentExamId,
			examScoringPolicy: schema.exams.scoringPolicy,
			classCourseId: schema.exams.classCourse,
		})
		.from(schema.grades)
		.innerJoin(schema.exams, eq(schema.grades.exam, schema.exams.id))
		.where(
			and(
				eq(schema.grades.student, studentId),
				inArray(schema.exams.classCourse, classCourseIds),
			),
		);

	// 4. Apply retake scoring policies (same logic as student-facts.service.ts)
	//    Group grades by classCourse, then resolve effective scores per exam
	const gradesByClassCourse = new Map<string, typeof rawGrades>();
	for (const grade of rawGrades) {
		const existing = gradesByClassCourse.get(grade.classCourseId) ?? [];
		existing.push(grade);
		gradesByClassCourse.set(grade.classCourseId, existing);
	}

	// effectiveScore per classCourse: weighted sum of exam scores × percentage
	const courseAverages = new Map<
		string,
		{ classCourseId: string; average: number }
	>();

	for (const [classCourseId, grades] of gradesByClassCourse) {
		const normalExams = grades.filter((g) => g.examSessionType === "normal");
		const retakeExams = grades.filter((g) => g.examSessionType === "retake");

		const retakeByParent = new Map<string, (typeof grades)[number]>();
		for (const retake of retakeExams) {
			if (retake.examParentId) {
				retakeByParent.set(retake.examParentId, retake);
			}
		}

		let weightedSum = 0;

		for (const normalGrade of normalExams) {
			let effectiveScore = Number(normalGrade.gradeScore);
			const percentage = Number(normalGrade.examPercentage);

			const retakeGrade = retakeByParent.get(normalGrade.examId);
			if (retakeGrade) {
				const retakeScore = Number(retakeGrade.gradeScore);
				const scoringPolicy = retakeGrade.examScoringPolicy ?? "replace";
				if (scoringPolicy === "replace") {
					effectiveScore = retakeScore;
				} else if (scoringPolicy === "best_of") {
					effectiveScore = Math.max(effectiveScore, retakeScore);
				}
				retakeByParent.delete(normalGrade.examId);
			}

			weightedSum += effectiveScore * (percentage / 100);
		}

		// Orphaned retakes (no parent grade)
		for (const retakeGrade of retakeByParent.values()) {
			weightedSum +=
				Number(retakeGrade.gradeScore) *
				(Number(retakeGrade.examPercentage) / 100);
		}

		courseAverages.set(classCourseId, {
			classCourseId,
			average: weightedSum,
		});
	}

	// 5. Group enrolled courses by UE and compute UE averages
	const ueMap = new Map<
		string,
		{
			ueId: string;
			ueCode: string;
			ueName: string;
			ueCredits: number;
			courses: UeCourseDetail[];
			weightedScoreSum: number;
			totalCoefficients: number;
			allCoursesGraded: boolean;
		}
	>();

	// Use enrollments (not grades) to determine which UEs the student is in
	for (const enrollment of enrollments) {
		const meta = ccMetaMap.get(enrollment.classCourseId);
		if (!meta) continue;

		const ue = ueMap.get(meta.teachingUnitId) ?? {
			ueId: meta.teachingUnitId,
			ueCode: meta.ueCode,
			ueName: meta.ueName,
			ueCredits: meta.ueCredits,
			courses: [],
			weightedScoreSum: 0,
			totalCoefficients: 0,
			allCoursesGraded: true,
		};

		const courseAvg = courseAverages.get(enrollment.classCourseId);
		const coefficient = Number(meta.coefficient);
		const hasGrade = courseAvg !== undefined;

		ue.courses.push({
			courseId: meta.courseId,
			courseCode: meta.courseCode,
			courseName: meta.courseName,
			coefficient,
			average: hasGrade ? courseAvg.average : null,
		});

		if (hasGrade) {
			ue.weightedScoreSum += courseAvg.average * coefficient;
			ue.totalCoefficients += coefficient;
		} else {
			ue.allCoursesGraded = false;
		}

		ueMap.set(meta.teachingUnitId, ue);
	}

	// 6. Compute per-UE results and aggregate credits
	let creditsEarned = 0;
	let creditsInProgress = 0;
	const ueResults: UeValidationResult[] = [];

	for (const ue of ueMap.values()) {
		let ueAverage: number | null = null;
		let status: UeValidationStatus;

		if (!ue.allCoursesGraded) {
			// Some courses have no grade yet
			status = "incomplete";
			if (ue.totalCoefficients > 0) {
				ueAverage = ue.weightedScoreSum / ue.totalCoefficients;
			}
			creditsInProgress += ue.ueCredits;
		} else if (ue.totalCoefficients > 0) {
			ueAverage = ue.weightedScoreSum / ue.totalCoefficients;
			if (ueAverage >= passingGrade) {
				status = "validated";
				creditsEarned += ue.ueCredits;
			} else {
				status = "failed";
			}
		} else {
			// No courses with coefficients (edge case)
			status = "incomplete";
			creditsInProgress += ue.ueCredits;
		}

		ueResults.push({
			ueId: ue.ueId,
			ueCode: ue.ueCode,
			ueName: ue.ueName,
			ueCredits: ue.ueCredits,
			ueAverage,
			status,
			courses: ue.courses,
		});
	}

	return { ueResults, creditsEarned, creditsInProgress };
}
