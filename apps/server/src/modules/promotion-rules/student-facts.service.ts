import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { StudentPromotionFacts } from "./promotion-rules.types";

const PASSING_GRADE = 10;
const COMPENSABLE_THRESHOLD = 8;

/**
 * Compute all facts for a student used in promotion rule evaluation.
 * This aggregates data from grades, enrollments, courses, credits, etc.
 */
export async function computeStudentFacts(
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

		// Credits
		creditsEarned: creditSummary.creditsEarned,
		creditsEarnedThisYear: creditSummary.creditsEarnedThisYear,
		creditsInProgress: creditSummary.creditsInProgress,
		creditsAttempted: creditSummary.creditsAttempted,
		requiredCredits: creditSummary.requiredCredits,
		creditDeficit: Math.max(
			0,
			creditSummary.requiredCredits - creditSummary.creditsEarned,
		),
		creditCompletionRate: creditSummary.creditCompletionRate,
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
			creditSummary.creditCompletionRate,
			transcript.successRate,
		),
		isOnTrack:
			creditSummary.creditCompletionRate >= 0.75 &&
			transcript.overallAverage >= PASSING_GRADE,
		progressionRate:
			enrollmentHistory.activeYearsCount > 0
				? creditSummary.creditsEarned / enrollmentHistory.activeYearsCount
				: 0,
		projectedCreditsEndOfYear:
			creditSummary.creditsEarned + creditSummary.creditsInProgress,
		canReachRequiredCredits:
			creditSummary.creditsEarned + creditSummary.creditsInProgress >=
			creditSummary.requiredCredits,
	};

	return facts;
}

/**
 * Get student transcript with course and unit averages.
 */
async function getStudentTranscript(studentId: string) {
	const courseScores = await db
		.select({
			courseId: schema.courses.id,
			courseName: schema.courses.name,
			courseCode: schema.courses.code,
			teachingUnitId: schema.teachingUnits.id,
			unitName: schema.teachingUnits.name,
			unitCode: schema.teachingUnits.code,
			unitCredits: schema.teachingUnits.credits,
			score: sql<number>`
				sum(${schema.grades.score} * (${schema.exams.percentage} / 100.0))
			`,
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
		.where(eq(schema.grades.student, studentId))
		.groupBy(
			schema.courses.id,
			schema.courses.name,
			schema.courses.code,
			schema.teachingUnits.id,
			schema.teachingUnits.name,
			schema.teachingUnits.code,
			schema.teachingUnits.credits,
		);

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
			}>;
			scoreSum: number;
			courseCount: number;
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
			scoreSum: 0,
			courseCount: 0,
		};

		unit.courses.push({
			id: course.courseId,
			name: course.courseName,
			code: course.courseCode,
			average: score,
		});
		unit.scoreSum += score;
		unit.courseCount += 1;
		unitMap.set(course.teachingUnitId, unit);

		// Overall totals
		totalScoreSum += score;
		totalCourseCount += 1;
		weightedScoreSum += score * credits;
		totalCredits += credits;
	}

	// Compute unit averages
	const averageByTeachingUnit: Record<
		string,
		{ average: number; code: string; name: string; credits: number }
	> = {};
	let lowestUnitAverage = Number.POSITIVE_INFINITY;
	let failedTeachingUnitsCount = 0;
	let validatedUnitsCount = 0;

	for (const [unitId, unit] of unitMap.entries()) {
		const unitAvg = unit.courseCount > 0 ? unit.scoreSum / unit.courseCount : 0;
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
