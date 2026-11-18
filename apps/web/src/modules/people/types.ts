import type { RouterOutputs } from "@/utils/trpc";

// Local type aliases — mirrors server/src/db/schema/app-schema.ts exports
export type BusinessRole =
	| "super_admin"
	| "administrator"
	| "dean"
	| "teacher"
	| "grade_editor"
	| "staff"
	| "student";

export type DomainUserStatus = "active" | "inactive" | "suspended";

/** Roles surfaced in the filter chips (excludes super_admin). */
export const ROLES: Array<Exclude<BusinessRole, "super_admin">> = [
	"administrator",
	"dean",
	"teacher",
	"grade_editor",
	"staff",
	"student",
];

/** A row of the people table. */
export type PersonRow = RouterOutputs["users"]["listPaged"]["items"][number];

export interface PeopleFilters {
	role: BusinessRole | "all";
	status: DomainUserStatus | "all";
	search: string;
	classId: string | null;
	academicYearId: string | null;
}

export type TimelineEvent = {
	id: string;
	type: "enrollment" | "deliberation" | "fee_cleared" | "promotion";
	date: string;
	academicYear: string | null;
	className: string | null;
	status?: string | null;
	admissionType?: string | null;
	finalDecision?: string | null;
	generalAverage?: number | null;
	mention?: string | null;
};
