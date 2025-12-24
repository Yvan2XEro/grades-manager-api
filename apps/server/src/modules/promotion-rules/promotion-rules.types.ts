/**
 * Facts computed for each student to be used in promotion rule evaluation.
 * These facts are passed to the json-rules-engine for evaluation.
 */
export type StudentPromotionFacts = {
	// Student identification
	studentId: string;
	registrationNumber: string;
	classId: string;
	className: string;
	programId: string;
	programCode: string;
	academicYearId: string;

	// Overall averages
	overallAverage: number; // Weighted by credits
	overallAverageUnweighted: number; // Simple average

	// Averages by teaching unit
	averageByTeachingUnit: Record<
		string,
		{
			average: number;
			code: string;
			name: string;
			credits: number;
		}
	>;

	// Averages by course
	averageByCourse: Record<
		string,
		{
			average: number;
			code: string;
			name: string;
		}
	>;

	// Score extremes
	lowestScore: number;
	highestScore: number;
	lowestUnitAverage: number;

	// Score distribution
	scoresAbove10: number;
	scoresBelow10: number;
	scoresBelow8: number;

	// Failures and validations
	failedCoursesCount: number;
	failedTeachingUnitsCount: number;
	compensableFailures: number; // Scores between 8 and 10
	eliminatoryFailures: number; // Scores below 8
	validatedCoursesCount: number;
	validatedUnitsCount: number;

	// Success rates
	successRate: number; // % of courses passed
	unitValidationRate: number; // % of units validated

	// Credits
	creditsEarned: number;
	creditsEarnedThisYear: number;
	creditsInProgress: number;
	creditsAttempted: number;
	requiredCredits: number;
	creditDeficit: number;
	creditCompletionRate: number; // earned / required
	creditSuccessRate: number; // earned / attempted

	// Attempts and retakes
	coursesWithMultipleAttempts: number;
	maxAttemptCount: number;
	totalAttempts: number;
	activeCourses: number;
	completedCourses: number;
	withdrawnCourses: number;
	failedCourseAttempts: number;
	firstAttemptSuccessRate: number;
	retakeSuccessRate: number;

	// Enrollment status
	enrollmentStatus: string;
	previousEnrollmentsCount: number;
	completedYears: number;
	activeYearsCount: number;

	// Advanced indicators
	performanceIndex: number; // Composite performance score
	isOnTrack: boolean;
	progressionRate: number;
	projectedCreditsEndOfYear: number;
	canReachRequiredCredits: boolean;

	// External student fields
	admissionType: "normal" | "transfer" | "direct" | "equivalence";
	isTransferStudent: boolean;
	isDirectAdmission: boolean;
	hasAcademicHistory: boolean;
	transferCredits: number;
	transferInstitution: string | null;
	transferLevel: string | null;
};

/**
 * Result of evaluating a student against promotion rules.
 */
export type StudentEvaluationResult = {
	student: {
		id: string;
		registrationNumber: string;
		name: string;
	};
	facts: StudentPromotionFacts;
	eligible: boolean;
	matchedRules: string[];
	failedRules?: string[];
	reasons?: string[];
};

/**
 * Batch evaluation result for a class.
 */
export type ClassPromotionEvaluation = {
	ruleId: string;
	ruleName: string;
	sourceClassId: string;
	sourceClassName: string;
	academicYearId: string;
	totalStudents: number;
	eligible: StudentEvaluationResult[];
	notEligible: StudentEvaluationResult[];
	evaluatedAt: Date;
};
