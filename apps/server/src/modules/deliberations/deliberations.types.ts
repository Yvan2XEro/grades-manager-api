import type {
	DeliberationDecision,
	DeliberationMention,
	DeliberationRuleCategory,
} from "@/db/schema/app-schema";
import type { StudentPromotionFacts } from "../promotion-rules/promotion-rules.types";

/** LMD-aligned UE decision codes. */
export type UeDecision = "ADM" | "CMP" | "AJ" | "INC";

/** A member of the deliberation jury. */
export type JuryMember = {
	domainUserId: string;
	name: string;
	role: string;
};

/** Aggregate statistics computed after a deliberation run. */
export type DeliberationStats = {
	totalStudents: number;
	admittedCount: number;
	compensatedCount: number;
	deferredCount: number;
	repeatCount: number;
	excludedCount: number;
	pendingCount: number;
	classAverage: number | null;
	successRate: number;
	highestAverage: number | null;
	lowestAverage: number | null;
};

/** Per-UE result for a student within a deliberation. */
export type DeliberationUeResult = {
	ueId: string;
	ueCode: string;
	ueName: string;
	ueCredits: number;
	ueAverage: number | null;
	isValidated: boolean;
	isComplete: boolean;
	decision: UeDecision;
	creditsEarned: number;
	courseResults: DeliberationCourseResult[];
};

/** Per-course result within a UE for a student. */
export type DeliberationCourseResult = {
	courseId: string;
	courseCode: string;
	courseName: string;
	coefficient: number;
	average: number | null;
	cc: number | null;
	ex: number | null;
	ccIsRetake: boolean;
	exIsRetake: boolean;
};

/** Trace of a rule evaluation against a student. */
export type RuleEvaluationTrace = {
	ruleId: string;
	ruleName: string;
	category: DeliberationRuleCategory;
	matched: boolean;
	decision: DeliberationDecision | null;
	reasons: string[];
};

/** Extended facts for deliberation rule evaluation. */
export type DeliberationFacts = StudentPromotionFacts & {
	compensableUECount: number;
	allUEsComplete: boolean;
	consecutiveRepeats: number;
	previousDeliberationDecision: DeliberationDecision | null;
	totalUECount: number;
	validatedUECount: number;
	failedUECount: number;
};

/** Full result of computing a single student during deliberation. */
export type DeliberationStudentComputeResult = {
	studentId: string;
	registrationNumber: string;
	studentName: string;
	generalAverage: number | null;
	totalCreditsEarned: number;
	totalCreditsPossible: number;
	ueResults: DeliberationUeResult[];
	autoDecision: DeliberationDecision;
	finalDecision: DeliberationDecision;
	rank: number | null;
	mention: DeliberationMention | null;
	rulesEvaluated: RuleEvaluationTrace[];
	factsSnapshot: Record<string, unknown>;
};

/** Full compute result for an entire deliberation session. */
export type DeliberationComputeResult = {
	deliberationId: string;
	stats: DeliberationStats;
	results: DeliberationStudentComputeResult[];
	computedAt: Date;
};

/** Data structure for diplomation export. */
export type DiplomationExportData = {
	institution: {
		name: string;
		code: string;
		logoUrl: string | null;
	};
	deliberation: {
		id: string;
		type: string;
		date: string | null;
		status: string;
		className: string;
		programName: string;
		academicYearName: string;
		semesterName: string | null;
	};
	jury: {
		president: { name: string; role: string } | null;
		members: JuryMember[];
	};
	students: Array<{
		rank: number | null;
		registrationNumber: string;
		lastName: string;
		firstName: string;
		generalAverage: number | null;
		totalCreditsEarned: number;
		totalCreditsPossible: number;
		finalDecision: DeliberationDecision | null;
		mention: DeliberationMention | null;
		ueResults: DeliberationUeResult[];
	}>;
	stats: DeliberationStats | null;
	signatures: Array<{ position: string; name: string }>;
};
