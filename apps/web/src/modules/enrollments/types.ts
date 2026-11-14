import type { RouterOutputs } from "@/utils/trpc";

type CourseEnrollmentListResponse =
	RouterOutputs["studentCourseEnrollments"]["list"];
export type CourseEnrollmentRow = CourseEnrollmentListResponse["items"][number];
type EnrollmentCreateResponse =
	RouterOutputs["studentCourseEnrollments"]["create"];
export type PrerequisiteWarning = EnrollmentCreateResponse["warnings"][number];
export type WarningCategory = "mandatory" | "recommended" | "corequisite";

export type EnrollmentStatusFilter =
	| "all"
	| "pending"
	| "active"
	| "completed"
	| "withdrawn";

type EnrollmentListItem =
	RouterOutputs["enrollments"]["listPaged"]["items"][number];
type ClassStudent = RouterOutputs["students"]["list"]["items"][number];

/** Enrollment of the list, joined with its student of the selected class. */
export type EnrollmentRow = EnrollmentListItem & { student?: ClassStudent };

export type BulkEnrollResult = {
	className: string;
	created: number;
	skipped: number;
	error?: string;
};
