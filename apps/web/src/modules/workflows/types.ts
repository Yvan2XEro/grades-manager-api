import type { RouterOutputs } from "@/utils/trpc";

/** Exam awaiting the dean's approval (`/approvals`). */
export type ExamItem = {
	id: string;
	name: string;
	percentage: string | number;
	status: string;
	type: string;
	date: Date | string | null;
	courseName: string | null;
	courseCode: string | null;
	className: string | null;
	classId: string | null;
};

export type PagedExam = RouterOutputs["exams"]["listPaged"]["items"][number];
export type AuditEvent = RouterOutputs["exams"]["getAuditHistory"][number];
/** Exam of a class course, as listed to the teacher. */
export type TeacherExam = RouterOutputs["exams"]["list"]["items"][number];

export type HistoryStatus = "approved" | "rejected" | "all";

export type PendingConfirm =
	| { kind: "single"; examId: string; examName: string }
	| { kind: "bulk"; examIds: string[] };
