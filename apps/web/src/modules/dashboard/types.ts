import type { ReactNode } from "react";

export type TFn = (key: string, opts?: Record<string, unknown>) => string;

/* ─── Admin dashboard ────────────────────────────────── */

export type KpiCard = {
	key: string;
	count: number;
	icon: ReactNode;
	gradient: string;
	iconColor: string;
	href: string;
	suffix?: string;
};

export type ProgramBar = { name: string; students: number };

export type StatusSlice = { name: string; value: number; color: string };

/* ─── Dean dashboard ─────────────────────────────────── */

export type CohortData = {
	classId: string;
	className: string;
	academicYear: string | null;
	totalStudents: number;
	totalExams: number;
	approvedExams: number;
	submittedExams: number;
	gradingProgress: number;
	avgGeneral: number | null;
	admittedCount: number;
	successRate: number | null;
};

/* ─── Student dashboard ──────────────────────────────── */

export type NotifItem = {
	id: string;
	type: string;
	readAt: string | Date | null;
	createdAt: string | Date;
	payload: unknown;
};

export type UeResult = {
	ueId: string;
	ueCode: string;
	ueName: string;
	ueCredits: number;
	ueAverage: number | null;
	isValidated: boolean;
	creditsEarned: number;
};

export type DecisionResult = {
	id: string;
	finalDecision: string | null;
	academicYear: string | null;
	className: string | null;
	isOverridden: boolean;
	generalAverage: number | null;
	totalCreditsEarned: number | null;
	totalCreditsPossible: number | null;
	mention: string | null;
	rank: number | null;
	ueResults: UeResult[];
	closedAt?: string | Date | null;
};

export type ClassInfo = {
	name: string;
	programInfo?: { name: string } | null;
	academicYearInfo?: { name: string } | null;
	cycleLevel?: { code: string } | null;
};

export type FeeAssignment = {
	id: string;
	status: string;
	effectiveAmount: number;
	paidAmount: number;
	currency: string;
	academicYear?: { name: string } | null;
};

export type UpcomingExam = {
	id: string;
	courseName: string;
	examTypeName: string | null;
	scheduledAt: string | null;
	duration: number | null;
};

export interface UEData {
	id: string;
	name: string;
	code: string;
	average: number;
	credits: number;
	courses: Array<{
		id: string;
		name: string;
		average: number;
		coefficient: number;
	}>;
}
