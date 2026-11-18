import type { RouterOutputs } from "@/utils/trpc";

/** Row of the exams list. */
export interface ExamRow {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	classCourse: string;
	isLocked: boolean;
	classCourseCode?: string | null;
	className?: string | null;
	courseName?: string | null;
	sessionType?: "normal" | "retake";
	parentExamId?: string | null;
	status?: string;
}

/** Class-course assignment as listed for the exam form and the exams list. */
export type ClassCourseOption = { id: string; class: string; course: string };

/** Values of an existing exam fed to the exam form. */
export interface ExamFormValuesIn {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	classCourse: string;
}

// ── Exam scheduler ──
export type PreviewClass = {
	id: string;
	name: string;
	programId: string;
	programName: string;
	classCourseCount: number;
};
export type SchedulerHistoryItem =
	RouterOutputs["examScheduler"]["history"]["items"][number];
export type SchedulerRunDetails = RouterOutputs["examScheduler"]["details"];
export type SchedulerRunExam =
	NonNullable<SchedulerRunDetails>["exams"][number];
export type SchedulerRetakeExam =
	RouterOutputs["examScheduler"]["previewRetakes"]["exams"][number];
export type SessionMode = "normal" | "retake";
export type ScoringPolicy = "replace" | "best_of";

// ── Participation roster ──
export type ParticipationExamItem = {
	id: string;
	name: string;
	classCourse: string;
};
export type ParticipationClassCourseItem = {
	id: string;
	code: string;
	courseName?: string | null;
};
export type ParticipationRow =
	RouterOutputs["attendance"]["getExamRoster"][number] & { id: string };

// ── Retake eligibility ──
export type RetakeEligibilityReason =
	| "NO_GRADE"
	| "FAILED_EXAM"
	| "PASSED_EXAM"
	| "ATTEMPT_LIMIT_REACHED"
	| "OVERRIDE_FORCE_ELIGIBLE"
	| "OVERRIDE_FORCE_INELIGIBLE";

export type OverrideDecision = "force_eligible" | "force_ineligible";

export interface EligibilityRow {
	/** Same as `studentCourseEnrollmentId` (row key of the table). */
	id: string;
	studentCourseEnrollmentId: string;
	studentId: string;
	registrationNumber: string;
	studentName: string;
	attempt: number;
	grade: number | null;
	status: "eligible" | "ineligible";
	reasons: RetakeEligibilityReason[];
	override?: {
		id: string;
		decision: OverrideDecision;
		reason: string;
	};
}

// ── Exam types ──
export type ExamTypeRow =
	RouterOutputs["examTypes"]["listPaged"]["items"][number];
