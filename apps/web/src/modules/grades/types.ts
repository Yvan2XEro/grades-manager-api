import type { RouterOutputs } from "@/utils/trpc";

// ─── Grade entry (one exam at a time) ────────────────────────────────────────

export type RosterStudent = {
	id: string;
	firstName: string;
	lastName: string;
	registrationNumber: string;
	status?: string;
};

export type EntryExam = {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	isLocked: boolean;
	status?: "draft" | "scheduled" | "submitted" | "approved" | "rejected";
	canEdit?: boolean;
	sessionType?: "normal" | "retake";
	parentExamId?: string | null;
	scoringPolicy?: "replace" | "best_of";
};

export type GradeInput = {
	studentId: string;
	examId: string;
	score: number;
};

export type CourseInfo = {
	course_name: string;
	course_code: string;
	teaching_unit_name: string;
	teaching_unit_code: string;
	class_name: string;
	program_name: string;
};

export type Delegate = {
	id: string;
	createdAt: string;
	editor: {
		id: string;
		firstName: string;
		lastName: string;
		primaryEmail: string | null;
	};
	grantedBy?: {
		id: string | null;
		firstName: string | null;
		lastName: string | null;
	} | null;
};

/** Existing grade of each student for the selected exam. */
export type GradesByStudent = Record<string, { score: number; id: string }>;

// ─── Fast grade entry (spreadsheet) ──────────────────────────────────────────

export type SpreadsheetExam = {
	id: string;
	name: string;
	type: string;
	percentage: number;
	isLocked: boolean;
	canEdit: boolean;
};

export type CellState = "idle" | "dirty" | "saving" | "saved" | "error";

export type CellKey = `${string}::${string}`; // `${studentId}::${examId}`

// ─── Teacher home ────────────────────────────────────────────────────────────

export interface ExamData {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	isLocked: boolean;
	status: string;
	canEdit: boolean;
	classCourseId: string;
}

export interface CourseData {
	classCourseId: string;
	courseName: string;
	className: string;
	programName: string;
	studentCount: number;
	exams: ExamData[];
	isDelegated: boolean;
}

export type TeacherCourseSort = "relevance" | "name" | "class";

// ─── Grade exports (admin) ───────────────────────────────────────────────────

export type ExcelCell = string | number | boolean | null | undefined;
export type ExcelRow = ExcelCell[];

export interface ExportClass {
	id: string;
	name: string;
	program: { id: string; name: string };
}

export interface ExamItem {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	courseName: string;
	courseCode?: string | null;
	classCourseCode?: string | null;
	sessionType?: "normal" | "retake";
	parentExamId?: string | null;
	scoringPolicy?: "replace" | "best_of";
}

export interface StudentExport {
	id: string;
	first_name: string;
	last_name: string;
	registration_number: string;
	birth_date: string | null;
	birth_place: string | null;
	gender: string | null;
	grades: {
		score: number;
		exam: {
			id: string;
			name: string;
			type: string;
			percentage: number;
			sessionType: "normal" | "retake";
			parentExamId: string | null;
			scoringPolicy: "replace" | "best_of";
			class_course: {
				id: string;
				code: string | null;
				course: { id: string; name: string; code: string | null };
			};
		};
	}[];
}

export type StudentListItem =
	RouterOutputs["students"]["list"]["items"][number];
export type ExportConfig = RouterOutputs["exports"]["getConfig"];

export type ExamSort = "course" | "date" | "type";

export type TeachingUnitItem = {
	id: string;
	code: string;
	name: string;
	credits: number;
};

export type ExportClassCourse = {
	id: string;
	coefficient: number;
	code: string;
	name: string;
};

/** Context of the transcript / PV header rows. */
export interface ExportContext {
	classData?: ExportClass;
	semester?: { name: string };
	year?: { name: string };
}

export type BulkExportReport = {
	kind: "Évaluations" | "EC" | "UE";
	total: number;
	succeeded: number;
	skipped: Array<{ id: string; reason: string }>;
	filename: string;
};

export type BulkScope = "all" | "selected";

// ─── Grade export (teacher) ──────────────────────────────────────────────────

export interface TeacherExportExam {
	id: string;
	name: string;
	date: string;
	percentage: number;
	courseName: string;
}
