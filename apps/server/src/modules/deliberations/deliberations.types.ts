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
		nameEn: string;
		code: string;
		abbreviation: string | null;
		logoUrl: string | null;
		sloganFr: string | null;
		address: string | null;
		postalBox: string | null;
		phone: string | null;
		signatoryName: string | null;
		signatoryTitle: string | null;
		city: string | null;
	};
	deliberation: {
		id: string;
		type: string;
		date: string | null;
		juryNumber: string | null;
		status: string;
		className: string;
		programName: string;
		academicYearName: string;
		semesterName: string | null;
		admissionDate: string | null;
	};
	program: {
		nameEn: string | null;
		abbreviation: string | null;
		domainFr: string | null;
		domainEn: string | null;
		specialiteFr: string | null;
		specialiteEn: string | null;
		cycleNameFr: string | null;
		cycleNameEn: string | null;
		diplomaTitleFr: string | null;
		diplomaTitleEn: string | null;
		attestationValidityFr: string | null;
		attestationValidityEn: string | null;
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
		dateOfBirth: string | null;
		placeOfBirth: string | null;
		generalAverage: number | null;
		totalCreditsEarned: number;
		totalCreditsPossible: number;
		finalDecision: DeliberationDecision | null;
		mention: DeliberationMention | null;
		gradeLetter: string | null;
		mentionEn: string | null;
		ueResults: DeliberationUeResult[];
	}>;
	stats: DeliberationStats | null;
	signatures: Array<{ position: string; name: string }>;
};

export type TranscriptCourseResult = {
	code: string;
	name: string;
	coefficient: number;
	grade: number | null;
	session: "normal" | "retake";
};

export type TranscriptUeResult = {
	code: string;
	name: string;
	credits: number;
	average: number | null;
	decision: "ADM" | "AJ";
	courses: TranscriptCourseResult[];
};

export type TranscriptStudentData = {
	registrationNumber: string;
	lastName: string;
	firstName: string;
	dateOfBirth: string | null;
	placeOfBirth: string | null;
	totalCredits: number;
	generalAverage: number | null;
	ues: TranscriptUeResult[];
};

export type TranscriptExportData = {
	institution: {
		name: string;
		nameEn: string;
		code: string;
		abbreviation: string | null;
		logoUrl: string | null;
		sloganFr: string | null;
		address: string | null;
		postalBox: string | null;
		phone: string | null;
		signatoryName: string | null;
		signatoryTitle: string | null;
		city: string | null;
	};
	academicYear: { name: string };
	program: {
		name: string;
		nameEn: string | null;
		abbreviation: string | null;
		domainFr: string | null;
		domainEn: string | null;
		specialiteFr: string | null;
		specialiteEn: string | null;
		cycle: string;
		cycleNameEn: string | null;
		level: string;
	};
	semester: {
		name: string;
		code: string;
	};
	className: string;
	students: TranscriptStudentData[];
};
