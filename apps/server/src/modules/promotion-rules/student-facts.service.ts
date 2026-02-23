import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { StudentPromotionFacts } from "./promotion-rules.types";

export type { StudentPromotionFacts };

const PASSING_GRADE = 10;
const COMPENSABLE_THRESHOLD = 8;

type GetStudentFactsOptions = {
	rebuildIfMissing?: boolean;
};

/**
 * Retrieve cached promotion facts for a student/year combination.
 * Optionally triggers a recomputation when the snapshot is missing.
 */
export async function getStudentPromotionFacts(
	studentId: string,
	academicYearId: string,
	options: GetStudentFactsOptions = {},
): Promise<StudentPromotionFacts> {
	const summary = await db.query.studentPromotionSummaries.findFirst({
		where: and(
			eq(schema.studentPromotionSummaries.studentId, studentId),
			eq(schema.studentPromotionSummaries.academicYearId, academicYearId),
		),
	});

	if (summary) {
		return summary.facts as StudentPromotionFacts;
	}

	if (options.rebuildIfMissing) {
		return refreshStudentPromotionSummary(studentId, academicYearId);
	}

	throw new Error(
		`Promotion summary missing for student ${studentId} (${academicYearId})`,
	);
}

/**
 * Rebuild (or build) the cached promotion summary for a student/year.
 */
export async function refreshStudentPromotionSummary(
	studentId: string,
	academicYearId: string,
): Promise<StudentPromotionFacts> {
	const facts = await buildStudentFacts(studentId, academicYearId);
	await saveStudentPromotionSummary(facts);
	return facts;
}

/**
 * Rebuild summaries for an entire class. Useful for cron jobs.
 */
export async function refreshClassPromotionSummaries(
	classId: string,
	academicYearId: string,
): Promise<StudentPromotionFacts[]> {
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, classId),
	});
	if (!klass) {
		throw new Error(`Class not found: ${classId}`);
	}
	if (klass.academicYear !== academicYearId) {
		throw new Error(
			`Class ${classId} belongs to ${klass.academicYear}, not ${academicYearId}`,
		);
	}

	const students = await db
		.select({ id: schema.students.id })
		.from(schema.students)
		.where(eq(schema.students.class, classId));

	const results: StudentPromotionFacts[] = [];
	for (const student of students) {
		results.push(
			await refreshStudentPromotionSummary(student.id, academicYearId),
		);
	}
	return results;
}

/**
 * Legacy helper retained for compatibility. It now refreshes the summary
 * before returning the computed facts snapshot.
 */
export async function computeStudentFacts(
	studentId: string,
	academicYearId: string,
): Promise<StudentPromotionFacts> {
	return refreshStudentPromotionSummary(studentId, academicYearId);
}

/**
 * Compute all facts for a student used in promotion rule evaluation.
 * This aggregates data from grades, enrollments, courses, credits, etc.
 */
async function buildStudentFacts(
	studentId: string,
	academicYearId: string,
): Promise<StudentPromotionFacts> {
	// Fetch student basic info
	const student = await db.query.students.findFirst({
		where: eq(schema.students.id, studentId),
		with: {
			classRef: {
				with: {
					program: true,
				},
			},
			profile: true,
		},
	});

	if (!student) {
		throw new Error(`Student not found: ${studentId}`);
	}

	// Get current active enrollment to retrieve admission info
	const currentEnrollment = await db.query.enrollments.findFirst({
		where: and(
			eq(schema.enrollments.studentId, studentId),
			eq(schema.enrollments.academicYearId, academicYearId),
		),
	});

	// Get transcript with course averages
	const transcript = await getStudentTranscript(studentId);

	// Get credit ledger
	const creditSummary = await getCreditSummary(studentId, academicYearId);

	// Get course enrollment stats
	const enrollmentStats = await getCourseEnrollmentStats(
		studentId,
		academicYearId,
	);

	// Get enrollment history
	const enrollmentHistory = await getEnrollmentHistory(studentId);

	// Compute all facts
	const facts: StudentPromotionFacts = {
		// Identification
		studentId: student.id,
		registrationNumber: student.registrationNumber,
		classId: student.class,
		className: student.classRef.name,
		programId: student.classRef.program.id,
		programCode: student.classRef.program.code,
		academicYearId,

		// Overall averages
		overallAverage: transcript.overallAverage,
		overallAverageUnweighted: transcript.overallAverageUnweighted,

		// By teaching unit
		averageByTeachingUnit: transcript.averageByTeachingUnit,

		// By course
		averageByCourse: transcript.averageByCourse,

		// Score extremes
		lowestScore: transcript.lowestScore,
		highestScore: transcript.highestScore,
		lowestUnitAverage: transcript.lowestUnitAverage,

		// Score distribution
		scoresAbove10: transcript.scoresAbove10,
		scoresBelow10: transcript.scoresBelow10,
		scoresBelow8: transcript.scoresBelow8,

		// Failures and validations
		failedCoursesCount: transcript.failedCoursesCount,
		failedTeachingUnitsCount: transcript.failedTeachingUnitsCount,
		compensableFailures: transcript.compensableFailures,
		eliminatoryFailures: transcript.eliminatoryFailures,
		validatedCoursesCount: transcript.validatedCoursesCount,
		validatedUnitsCount: transcript.validatedUnitsCount,

		// Success rates
		successRate: transcript.successRate,
		unitValidationRate: transcript.unitValidationRate,

		// Credits (transfer credits are already included in creditSummary via ledger)
		creditsEarned: creditSummary.creditsEarned,
		creditsEarnedThisYear: creditSummary.creditsEarnedThisYear,
		creditsInProgress: creditSummary.creditsInProgress,
		creditsAttempted: creditSummary.creditsAttempted,
		requiredCredits: creditSummary.requiredCredits,
		creditDeficit: Math.max(
			0,
			creditSummary.requiredCredits - creditSummary.creditsEarned,
		),
		creditCompletionRate:
			creditSummary.requiredCredits > 0
				? creditSummary.creditsEarned / creditSummary.requiredCredits
				: 0,
		creditSuccessRate: creditSummary.creditSuccessRate,

		// Attempts and retakes
		coursesWithMultipleAttempts: enrollmentStats.coursesWithMultipleAttempts,
		maxAttemptCount: enrollmentStats.maxAttemptCount,
		totalAttempts: enrollmentStats.totalAttempts,
		activeCourses: enrollmentStats.activeCourses,
		completedCourses: enrollmentStats.completedCourses,
		withdrawnCourses: enrollmentStats.withdrawnCourses,
		failedCourseAttempts: enrollmentStats.failedCourseAttempts,
		firstAttemptSuccessRate: enrollmentStats.firstAttemptSuccessRate,
		retakeSuccessRate: enrollmentStats.retakeSuccessRate,

		// Enrollment status
		enrollmentStatus: enrollmentHistory.currentStatus,
		previousEnrollmentsCount: enrollmentHistory.previousEnrollmentsCount,
		completedYears: enrollmentHistory.completedYears,
		activeYearsCount: enrollmentHistory.activeYearsCount,

		// Advanced indicators
		performanceIndex: computePerformanceIndex(
			transcript.overallAverage,
			creditSummary.requiredCredits > 0
				? creditSummary.creditsEarned / creditSummary.requiredCredits
				: 0,
			transcript.successRate,
		),
		isOnTrack:
			(creditSummary.requiredCredits > 0
				? creditSummary.creditsEarned / creditSummary.requiredCredits
				: 0) >= 0.75 && transcript.overallAverage >= PASSING_GRADE,
		progressionRate:
			enrollmentHistory.activeYearsCount > 0
				? creditSummary.creditsEarned / enrollmentHistory.activeYearsCount
				: 0,
		projectedCreditsEndOfYear:
			creditSummary.creditsEarned + creditSummary.creditsInProgress,
		canReachRequiredCredits:
			creditSummary.creditsEarned + creditSummary.creditsInProgress >=
			creditSummary.requiredCredits,

		// External student fields (from current enrollment)
		admissionType: currentEnrollment?.admissionType ?? "normal",
		isTransferStudent: currentEnrollment?.admissionType === "transfer",
		isDirectAdmission:
			currentEnrollment?.admissionType === "direct" ||
			currentEnrollment?.admissionType === "equivalence",
		hasAcademicHistory:
			transcript.overallAverage > 0 || transcript.validatedCoursesCount > 0,
		transferCredits: currentEnrollment?.transferCredits ?? 0,
		transferInstitution: currentEnrollment?.transferInstitution ?? null,
		transferLevel: currentEnrollment?.transferLevel ?? null,
	};

	return facts;
}

async function saveStudentPromotionSummary(facts: StudentPromotionFacts) {
	const record = mapFactsToSummaryRecord(facts);
	await db
		.insert(schema.studentPromotionSummaries)
		.values(record)
		.onConflictDoUpdate({
			target: [
				schema.studentPromotionSummaries.studentId,
				schema.studentPromotionSummaries.academicYearId,
			],
			set: {
				...record,
				computedAt: record.computedAt,
			},
		});
}

function mapFactsToSummaryRecord(
	facts: StudentPromotionFacts,
): schema.NewStudentPromotionSummary {
	return {
		studentId: facts.studentId,
		academicYearId: facts.academicYearId,
		classId: facts.classId,
		programId: facts.programId,
		registrationNumber: facts.registrationNumber,
		className: facts.className,
		programCode: facts.programCode,
		computedAt: new Date(),
		overallAverage: facts.overallAverage,
		overallAverageUnweighted: facts.overallAverageUnweighted,
		successRate: facts.successRate,
		unitValidationRate: facts.unitValidationRate,
		creditsEarned: facts.creditsEarned,
		creditsEarnedThisYear: facts.creditsEarnedThisYear,
		creditsAttempted: facts.creditsAttempted,
		creditsInProgress: facts.creditsInProgress,
		requiredCredits: facts.requiredCredits,
		creditCompletionRate: facts.creditCompletionRate,
		creditDeficit: facts.creditDeficit,
		creditSuccessRate: facts.creditSuccessRate,
		performanceIndex: facts.performanceIndex,
		isOnTrack: facts.isOnTrack,
		progressionRate: facts.progressionRate,
		projectedCreditsEndOfYear: facts.projectedCreditsEndOfYear,
		canReachRequiredCredits: facts.canReachRequiredCredits,
		failedTeachingUnitsCount: facts.failedTeachingUnitsCount,
		eliminatoryFailures: facts.eliminatoryFailures,
		scoresBelow8: facts.scoresBelow8,
		admissionType: facts.admissionType,
		isTransferStudent: facts.isTransferStudent,
		isDirectAdmission: facts.isDirectAdmission,
		hasAcademicHistory: facts.hasAcademicHistory,
		transferCredits: facts.transferCredits,
		transferInstitution: facts.transferInstitution,
		transferLevel: facts.transferLevel,
		averagesByTeachingUnit: facts.averageByTeachingUnit,
		averagesByCourse: facts.averageByCourse,
		facts,
	};
}

/**
 * Get student transcript with course and unit averages.
 * Properly handles retake exam scoring policies (replace vs best_of).
 */
async function getStudentTranscript(studentId: string) {
	// First, get all grades with exam details including retake info
	const rawGrades = await db
		.select({
			gradeId: schema.grades.id,
			gradeScore: schema.grades.score,
			examId: schema.exams.id,
			examPercentage: schema.exams.percentage,
			examSessionType: schema.exams.sessionType,
			examParentId: schema.exams.parentExamId,
			examScoringPolicy: schema.exams.scoringPolicy,
			classCourseId: schema.classCourses.id,
			classCourseCoefficient: schema.classCourses.coefficient,
			courseId: schema.courses.id,
			courseName: schema.courses.name,
			courseCode: schema.courses.code,
			teachingUnitId: schema.teachingUnits.id,
			unitName: schema.teachingUnits.name,
			unitCode: schema.teachingUnits.code,
			unitCredits: schema.teachingUnits.credits,
		})
		.from(schema.grades)
		.innerJoin(schema.exams, eq(schema.grades.exam, schema.exams.id))
		.innerJoin(
			schema.classCourses,
			eq(schema.exams.classCourse, schema.classCourses.id),
		)
		.innerJoin(
			schema.courses,
			eq(schema.classCourses.course, schema.courses.id),
		)
		.innerJoin(
			schema.teachingUnits,
			eq(schema.courses.teachingUnitId, schema.teachingUnits.id),
		)
		.where(eq(schema.grades.student, studentId));

	// Apply retake scoring policies to determine effective grades per exam
	// Group grades by classCourse to handle retake relationships
	const gradesByClassCourse = new Map<
		string,
		Array<(typeof rawGrades)[number]>
	>();
	for (const grade of rawGrades) {
		const existing = gradesByClassCourse.get(grade.classCourseId) ?? [];
		existing.push(grade);
		gradesByClassCourse.set(grade.classCourseId, existing);
	}

	// Build effective grades considering retake policies
	const effectiveGrades: Array<{
		courseId: string;
		courseName: string;
		courseCode: string;
		teachingUnitId: string;
		unitName: string;
		unitCode: string;
		unitCredits: number;
		coefficient: number;
		effectiveScore: number;
		percentage: number;
	}> = [];

	for (const [_classCourseId, grades] of gradesByClassCourse) {
		// Separate normal and retake exams
		const normalExams = grades.filter((g) => g.examSessionType === "normal");
		const retakeExams = grades.filter((g) => g.examSessionType === "retake");

		// Build a map of parent exam IDs to their retake grades
		const retakeByParent = new Map<string, (typeof grades)[number]>();
		for (const retake of retakeExams) {
			if (retake.examParentId) {
				retakeByParent.set(retake.examParentId, retake);
			}
		}

		// Process each normal exam, applying retake policies
		for (const normalGrade of normalExams) {
			const retakeGrade = retakeByParent.get(normalGrade.examId);
			let effectiveScore = Number(normalGrade.gradeScore);
			const percentage = Number(normalGrade.examPercentage);

			if (retakeGrade) {
				const retakeScore = Number(retakeGrade.gradeScore);
				const scoringPolicy = retakeGrade.examScoringPolicy ?? "replace";

				if (scoringPolicy === "replace") {
					// Replace: use retake grade only
					effectiveScore = retakeScore;
				} else if (scoringPolicy === "best_of") {
					// Best of: use the higher grade
					effectiveScore = Math.max(effectiveScore, retakeScore);
				}
				// Remove from retake map so we don't double-count
				retakeByParent.delete(normalGrade.examId);
			}

			effectiveGrades.push({
				courseId: normalGrade.courseId,
				courseName: normalGrade.courseName,
				courseCode: normalGrade.courseCode,
				teachingUnitId: normalGrade.teachingUnitId,
				unitName: normalGrade.unitName,
				unitCode: normalGrade.unitCode,
				unitCredits: Number(normalGrade.unitCredits),
				coefficient: Number(normalGrade.classCourseCoefficient),
				effectiveScore,
				percentage,
			});
		}

		// Handle any orphaned retake exams (without parent grades)
		for (const retakeGrade of retakeByParent.values()) {
			effectiveGrades.push({
				courseId: retakeGrade.courseId,
				courseName: retakeGrade.courseName,
				courseCode: retakeGrade.courseCode,
				teachingUnitId: retakeGrade.teachingUnitId,
				unitName: retakeGrade.unitName,
				unitCode: retakeGrade.unitCode,
				unitCredits: Number(retakeGrade.unitCredits),
				coefficient: Number(retakeGrade.classCourseCoefficient),
				effectiveScore: Number(retakeGrade.gradeScore),
				percentage: Number(retakeGrade.examPercentage),
			});
		}
	}

	// Now aggregate effective grades by course
	const courseScoreMap = new Map<
		string,
		{
			courseId: string;
			courseName: string;
			courseCode: string;
			teachingUnitId: string;
			unitName: string;
			unitCode: string;
			unitCredits: number;
			coefficient: number;
			weightedSum: number;
		}
	>();

	for (const grade of effectiveGrades) {
		const existing = courseScoreMap.get(grade.courseId);
		const weightedScore = grade.effectiveScore * (grade.percentage / 100);

		if (existing) {
			existing.weightedSum += weightedScore;
		} else {
			courseScoreMap.set(grade.courseId, {
				courseId: grade.courseId,
				courseName: grade.courseName,
				courseCode: grade.courseCode,
				teachingUnitId: grade.teachingUnitId,
				unitName: grade.unitName,
				unitCode: grade.unitCode,
				unitCredits: grade.unitCredits,
				coefficient: grade.coefficient,
				weightedSum: weightedScore,
			});
		}
	}

	// Convert to array format expected by the rest of the function
	const courseScores = Array.from(courseScoreMap.values()).map((course) => ({
		courseId: course.courseId,
		courseName: course.courseName,
		courseCode: course.courseCode,
		teachingUnitId: course.teachingUnitId,
		unitName: course.unitName,
		unitCode: course.unitCode,
		unitCredits: course.unitCredits,
		coefficient: course.coefficient,
		score: course.weightedSum,
	}));

	// Organize by teaching units
	const unitMap = new Map<
		string,
		{
			id: string;
			name: string;
			code: string;
			credits: number;
			courses: Array<{
				id: string;
				name: string;
				code: string;
				average: number;
				coefficient: number;
			}>;
			weightedScoreSum: number;
			totalCoefficients: number;
		}
	>();

	const averageByCourse: Record<
		string,
		{ average: number; code: string; name: string }
	> = {};

	let totalScoreSum = 0;
	let totalCourseCount = 0;
	let weightedScoreSum = 0;
	let totalCredits = 0;

	for (const course of courseScores) {
		const score = Number(course.score ?? 0);
		const credits = Number(course.unitCredits ?? 0);
		const coefficient = Number(course.coefficient ?? 1);

		// Add to course averages
		averageByCourse[course.courseId] = {
			average: score,
			code: course.courseCode,
			name: course.courseName,
		};

		// Add to unit
		const unit = unitMap.get(course.teachingUnitId) ?? {
			id: course.teachingUnitId,
			name: course.unitName,
			code: course.unitCode,
			credits,
			courses: [],
			weightedScoreSum: 0,
			totalCoefficients: 0,
		};

		unit.courses.push({
			id: course.courseId,
			name: course.courseName,
			code: course.courseCode,
			average: score,
			coefficient,
		});
		unit.weightedScoreSum += score * coefficient;
		unit.totalCoefficients += coefficient;
		unitMap.set(course.teachingUnitId, unit);

		// Overall totals
		totalScoreSum += score;
		totalCourseCount += 1;
		weightedScoreSum += score * credits;
		totalCredits += credits;
	}

	// Compute unit averages (coefficient-weighted: Σ(score × coeff) / Σ(coeff))
	const averageByTeachingUnit: Record<
		string,
		{ average: number; code: string; name: string; credits: number }
	> = {};
	let lowestUnitAverage = Number.POSITIVE_INFINITY;
	let failedTeachingUnitsCount = 0;
	let validatedUnitsCount = 0;

	for (const [unitId, unit] of unitMap.entries()) {
		const unitAvg =
			unit.totalCoefficients > 0
				? unit.weightedScoreSum / unit.totalCoefficients
				: 0;
		averageByTeachingUnit[unitId] = {
			average: unitAvg,
			code: unit.code,
			name: unit.name,
			credits: unit.credits,
		};

		if (unitAvg < lowestUnitAverage) {
			lowestUnitAverage = unitAvg;
		}

		if (unitAvg < PASSING_GRADE) {
			failedTeachingUnitsCount += 1;
		} else {
			validatedUnitsCount += 1;
		}
	}

	// Score statistics
	const courseAverages = Object.values(averageByCourse).map((c) => c.average);
	const lowestScore =
		courseAverages.length > 0
			? Math.min(...courseAverages)
			: Number.POSITIVE_INFINITY;
	const highestScore =
		courseAverages.length > 0
			? Math.max(...courseAverages)
			: Number.NEGATIVE_INFINITY;

	const scoresAbove10 = courseAverages.filter((s) => s >= PASSING_GRADE).length;
	const scoresBelow10 = courseAverages.filter((s) => s < PASSING_GRADE).length;
	const scoresBelow8 = courseAverages.filter(
		(s) => s < COMPENSABLE_THRESHOLD,
	).length;

	const failedCoursesCount = scoresBelow10;
	const validatedCoursesCount = scoresAbove10;
	const compensableFailures = courseAverages.filter(
		(s) => s >= COMPENSABLE_THRESHOLD && s < PASSING_GRADE,
	).length;
	const eliminatoryFailures = scoresBelow8;

	const successRate =
		totalCourseCount > 0 ? validatedCoursesCount / totalCourseCount : 0;
	const unitValidationRate =
		unitMap.size > 0 ? validatedUnitsCount / unitMap.size : 0;

	return {
		overallAverage: totalCredits > 0 ? weightedScoreSum / totalCredits : 0,
		overallAverageUnweighted:
			totalCourseCount > 0 ? totalScoreSum / totalCourseCount : 0,
		averageByTeachingUnit,
		averageByCourse,
		lowestScore: lowestScore === Number.POSITIVE_INFINITY ? 0 : lowestScore,
		highestScore: highestScore === Number.NEGATIVE_INFINITY ? 0 : highestScore,
		lowestUnitAverage:
			lowestUnitAverage === Number.POSITIVE_INFINITY ? 0 : lowestUnitAverage,
		scoresAbove10,
		scoresBelow10,
		scoresBelow8,
		failedCoursesCount,
		failedTeachingUnitsCount,
		compensableFailures,
		eliminatoryFailures,
		validatedCoursesCount,
		validatedUnitsCount,
		successRate,
		unitValidationRate,
	};
}

/**
 * Get credit summary for a student.
 */
async function getCreditSummary(studentId: string, academicYearId: string) {
	// Get all credit ledgers for this student
	const ledgers = await db
		.select()
		.from(schema.studentCreditLedgers)
		.where(eq(schema.studentCreditLedgers.studentId, studentId));

	// Find current year ledger
	const currentYearLedger = ledgers.find(
		(l) => l.academicYearId === academicYearId,
	);

	// Sum all earned credits
	const creditsEarned = ledgers.reduce(
		(sum, ledger) => sum + ledger.creditsEarned,
		0,
	);

	// Sum credits in progress
	const creditsInProgress = ledgers.reduce(
		(sum, ledger) => sum + ledger.creditsInProgress,
		0,
	);

	// Credits from this year
	const creditsEarnedThisYear = currentYearLedger?.creditsEarned ?? 0;
	const creditsAttempted = currentYearLedger
		? currentYearLedger.creditsEarned + currentYearLedger.creditsInProgress
		: 0;

	const requiredCredits =
		currentYearLedger?.requiredCredits ?? ledgers[0]?.requiredCredits ?? 60;

	const creditCompletionRate =
		requiredCredits > 0 ? creditsEarned / requiredCredits : 0;
	const creditSuccessRate =
		creditsAttempted > 0 ? creditsEarnedThisYear / creditsAttempted : 0;

	return {
		creditsEarned,
		creditsEarnedThisYear,
		creditsInProgress,
		creditsAttempted,
		requiredCredits,
		creditCompletionRate,
		creditSuccessRate,
	};
}

/**
 * Get course enrollment statistics.
 */
async function getCourseEnrollmentStats(
	studentId: string,
	academicYearId: string,
) {
	const enrollments = await db
		.select()
		.from(schema.studentCourseEnrollments)
		.where(
			and(
				eq(schema.studentCourseEnrollments.studentId, studentId),
				eq(schema.studentCourseEnrollments.academicYearId, academicYearId),
			),
		);

	// Group by course to count attempts
	const courseAttempts = new Map<string, number>();
	for (const enrollment of enrollments) {
		const current = courseAttempts.get(enrollment.courseId) ?? 0;
		courseAttempts.set(enrollment.courseId, current + 1);
	}

	const coursesWithMultipleAttempts = Array.from(
		courseAttempts.values(),
	).filter((count) => count > 1).length;
	const maxAttemptCount =
		courseAttempts.size > 0 ? Math.max(...courseAttempts.values()) : 0;
	const totalAttempts = enrollments.length;

	// Count by status
	const activeCourses = enrollments.filter(
		(e) => e.status === "active" || e.status === "planned",
	).length;
	const completedCourses = enrollments.filter(
		(e) => e.status === "completed",
	).length;
	const withdrawnCourses = enrollments.filter(
		(e) => e.status === "withdrawn",
	).length;
	const failedCourseAttempts = enrollments.filter(
		(e) => e.status === "failed",
	).length;

	// Success rates
	const firstAttempts = Array.from(courseAttempts.entries()).filter(
		([_, count]) => count === 1,
	).length;
	const firstAttemptSuccesses = enrollments.filter(
		(e) => e.attempt === 1 && e.status === "completed",
	).length;
	const firstAttemptSuccessRate =
		firstAttempts > 0 ? firstAttemptSuccesses / firstAttempts : 0;

	const retakes = enrollments.filter((e) => e.attempt > 1);
	const retakeSuccesses = retakes.filter(
		(e) => e.status === "completed",
	).length;
	const retakeSuccessRate =
		retakes.length > 0 ? retakeSuccesses / retakes.length : 0;

	return {
		coursesWithMultipleAttempts,
		maxAttemptCount,
		totalAttempts,
		activeCourses,
		completedCourses,
		withdrawnCourses,
		failedCourseAttempts,
		firstAttemptSuccessRate,
		retakeSuccessRate,
	};
}

/**
 * Get enrollment history for a student.
 */
async function getEnrollmentHistory(studentId: string) {
	const enrollments = await db
		.select()
		.from(schema.enrollments)
		.where(eq(schema.enrollments.studentId, studentId))
		.orderBy(schema.enrollments.enrolledAt);

	const currentStatus =
		enrollments.length > 0
			? enrollments[enrollments.length - 1].status
			: "pending";

	const previousEnrollmentsCount = Math.max(0, enrollments.length - 1);
	const completedYears = enrollments.filter(
		(e) => e.status === "completed",
	).length;
	const activeYearsCount = enrollments.filter(
		(e) => e.status === "active" || e.status === "pending",
	).length;

	return {
		currentStatus,
		previousEnrollmentsCount,
		completedYears,
		activeYearsCount,
	};
}

/**
 * Compute a composite performance index (0-100).
 */
function computePerformanceIndex(
	overallAverage: number,
	creditCompletionRate: number,
	successRate: number,
): number {
	// Weighted average:
	// 50% grade average (normalized to 0-1)
	// 30% credit completion
	// 20% success rate
	const normalizedAverage = overallAverage / 20; // Assuming 0-20 scale
	return normalizedAverage * 50 + creditCompletionRate * 30 + successRate * 20;
}

/**
 * Trigger recalculation of promotion summary after a retake grade is submitted.
 * Looks up the academic year from the exam's class course and refreshes the student's summary.
 */
export async function refreshAfterRetakeGrade(
	studentId: string,
	examId: string,
): Promise<StudentPromotionFacts | null> {
	// Lookup the academic year from the exam's class course
	const examInfo = await db
		.select({
			academicYearId: schema.classes.academicYear,
		})
		.from(schema.exams)
		.innerJoin(
			schema.classCourses,
			eq(schema.exams.classCourse, schema.classCourses.id),
		)
		.innerJoin(schema.classes, eq(schema.classCourses.class, schema.classes.id))
		.where(eq(schema.exams.id, examId))
		.limit(1);

	if (!examInfo.length) {
		return null;
	}

	const { academicYearId } = examInfo[0];

	// Refresh the student's promotion summary
	return refreshStudentPromotionSummary(studentId, academicYearId);
}
