import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PersonRow } from "../types";

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
	administrator: "default",
	dean: "default",
	teacher: "secondary",
	grade_editor: "secondary",
	staff: "outline",
	student: "outline",
};

const dash = <span className="text-muted-foreground text-sm">—</span>;

/** Columns of the people table; students get class / reg. number / enrollment instead of email. */
export function getPeopleColumns(
	t: TFunction,
	isStudent: boolean,
): ColumnDef<PersonRow>[] {
	const studentColumns: ColumnDef<PersonRow>[] = [
		{
			id: "class",
			header: t("usersHub.people.class", { defaultValue: "Class" }),
			cell: ({ row: { original: person } }) =>
				"currentClassName" in person ? (person.currentClassName ?? "—") : "—",
		},
		{
			id: "registrationNumber",
			header: t("usersHub.people.regNumber", { defaultValue: "Reg. number" }),
			cell: ({ row: { original: person } }) =>
				"registrationNumber" in person
					? (person.registrationNumber ?? "—")
					: "—",
		},
		{
			id: "enrollmentStatus",
			header: t("usersHub.people.enrollmentStatus", {
				defaultValue: "Enrollment",
			}),
			cell: ({ row: { original: person } }) =>
				"currentEnrollmentStatus" in person &&
				person.currentEnrollmentStatus ? (
					<Badge variant="outline">
						{t(`enrollments.status.${person.currentEnrollmentStatus}`, {
							defaultValue: person.currentEnrollmentStatus,
						})}
					</Badge>
				) : (
					dash
				),
		},
	];

	const emailColumn: ColumnDef<PersonRow> = {
		id: "email",
		header: t("common.fields.email", { defaultValue: "Email" }),
		cell: ({ row }) => (
			<span className="text-muted-foreground text-sm">
				{row.original.primaryEmail}
			</span>
		),
	};

	return [
		{
			id: "name",
			header: t("common.fields.name", { defaultValue: "Name" }),
			cell: ({ row }) => (
				<span className="font-medium">
					{row.original.firstName} {row.original.lastName}
				</span>
			),
		},
		{
			id: "role",
			header: t("common.fields.role", { defaultValue: "Role" }),
			cell: ({ row: { original: person } }) =>
				person.role ? (
					<Badge variant={roleBadgeVariant[person.role] ?? "outline"}>
						{t(`roles.${person.role}`, { defaultValue: person.role })}
					</Badge>
				) : (
					dash
				),
		},
		...(isStudent ? studentColumns : [emailColumn]),
		{
			id: "status",
			header: t("common.fields.status", { defaultValue: "Status" }),
			cell: ({ row: { original: person } }) => (
				<Badge variant={person.status === "active" ? "default" : "secondary"}>
					{t(`common.${person.status}`, { defaultValue: person.status ?? "" })}
				</Badge>
			),
		},
		{
			id: "account",
			header: t("usersHub.people.account", { defaultValue: "Compte" }),
			cell: ({ row }) =>
				row.original.memberId ? (
					<span className="inline-flex items-center gap-1 text-emerald-600 text-xs dark:text-emerald-400">
						<UserCheck className="h-3.5 w-3.5" />
						{t("usersHub.people.hasAccount", { defaultValue: "Actif" })}
					</span>
				) : (
					<span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
						<UserX className="h-3.5 w-3.5" />
						{t("usersHub.people.noAccount", { defaultValue: "Aucun" })}
					</span>
				),
		},
	];
}
