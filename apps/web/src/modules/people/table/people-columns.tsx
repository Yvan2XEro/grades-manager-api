import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	enrollmentStatusLabel,
	profileStatusLabel,
	roleLabel,
} from "@/lib/enum-labels";
import type { PersonRow } from "../types";

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
	owner: "default",
	administrator: "default",
	dean: "default",
	teacher: "secondary",
	grade_editor: "secondary",
	staff: "outline",
	student: "outline",
};

const dash = <span className="text-muted-foreground text-sm">—</span>;

/**
 * Columns of the people table. Students get class / reg. number / enrollment
 * instead of role, email and profile status (all of them are students).
 */
export function getPeopleColumns(
	t: TFunction,
	isStudent: boolean,
): ColumnDef<PersonRow>[] {
	const studentColumns: ColumnDef<PersonRow>[] = [
		{
			id: "class",
			header: t("usersHub.people.class"),
			cell: ({ row: { original: person } }) =>
				"currentClassName" in person ? (person.currentClassName ?? "—") : "—",
		},
		{
			id: "registrationNumber",
			header: t("usersHub.people.regNumber"),
			cell: ({ row: { original: person } }) =>
				"registrationNumber" in person
					? (person.registrationNumber ?? "—")
					: "—",
		},
		{
			id: "enrollmentStatus",
			header: t("usersHub.people.enrollmentStatus"),
			cell: ({ row: { original: person } }) =>
				"currentEnrollmentStatus" in person &&
				person.currentEnrollmentStatus ? (
					<Badge variant="outline">
						{enrollmentStatusLabel(String(person.currentEnrollmentStatus))}
					</Badge>
				) : (
					dash
				),
		},
	];

	const emailColumn: ColumnDef<PersonRow> = {
		id: "email",
		header: t("common.fields.email"),
		cell: ({ row }) => (
			<span className="text-muted-foreground text-sm">
				{row.original.primaryEmail}
			</span>
		),
	};

	const nameColumn: ColumnDef<PersonRow> = {
		id: "name",
		header: t("common.fields.name"),
		cell: ({ row }) => (
			<span className="font-medium">
				{row.original.firstName} {row.original.lastName}
			</span>
		),
	};

	const roleColumn: ColumnDef<PersonRow> = {
		id: "role",
		header: t("common.fields.role"),
		cell: ({ row: { original: person } }) =>
			person.role ? (
				<Badge variant={roleBadgeVariant[person.role] ?? "outline"}>
					{roleLabel(person.role)}
				</Badge>
			) : (
				dash
			),
	};

	const statusColumn: ColumnDef<PersonRow> = {
		id: "status",
		header: t("common.fields.status"),
		cell: ({ row: { original: person } }) => (
			<Badge variant={person.status === "active" ? "default" : "secondary"}>
				{profileStatusLabel(person.status)}
			</Badge>
		),
	};

	const accountColumn: ColumnDef<PersonRow> = {
		id: "account",
		header: t("usersHub.people.account"),
		cell: ({ row }) =>
			row.original.memberId ? (
				<span className="inline-flex items-center gap-1 text-emerald-600 text-xs dark:text-emerald-400">
					<UserCheck className="h-3.5 w-3.5" />
					{t("usersHub.people.hasAccount")}
				</span>
			) : (
				<span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
					<UserX className="h-3.5 w-3.5" />
					{t("usersHub.people.noAccount")}
				</span>
			),
	};

	return isStudent
		? [nameColumn, ...studentColumns, accountColumn]
		: [nameColumn, roleColumn, emailColumn, statusColumn, accountColumn];
}
