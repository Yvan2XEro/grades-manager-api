import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { ApplicationStatusBadge } from "../components/application-status-badge";
import type { ApplicationListRow } from "../types";

export function getApplicationsColumns(
	t: TFunction,
): ColumnDef<ApplicationListRow>[] {
	return [
		{
			id: "reference",
			header: t("admissions.admin.cols.reference"),
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-xs">
					{row.original.applicant.referenceCode}
				</span>
			),
		},
		{
			id: "name",
			header: t("admissions.admin.cols.name"),
			cell: ({ row: { original: app } }) => (
				<>
					<div className="font-medium">
						{app.applicant.lastName} {app.applicant.firstName}
					</div>
					<div className="text-muted-foreground text-xs md:hidden">
						{app.applicant.email}
					</div>
				</>
			),
		},
		{
			id: "email",
			header: t("admissions.fields.email"),
			meta: { className: "hidden md:table-cell" },
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.applicant.email}
				</span>
			),
		},
		{
			id: "program",
			header: t("admissions.fields.program"),
			meta: { className: "hidden lg:table-cell" },
			cell: ({ row }) => (
				<span className="text-sm">{row.original.program.name}</span>
			),
		},
		{
			id: "academicYear",
			header: t("admissions.fields.academicYear"),
			meta: { className: "hidden lg:table-cell" },
			cell: ({ row }) => (
				<span className="text-sm">{row.original.academicYear.name}</span>
			),
		},
		{
			id: "status",
			header: t("admissions.admin.cols.status"),
			cell: ({ row }) => (
				<ApplicationStatusBadge status={row.original.status} />
			),
		},
		{
			id: "date",
			header: t("admissions.admin.cols.date"),
			meta: { className: "hidden xl:table-cell" },
			cell: ({ row }) => (
				<span className="text-muted-foreground text-xs">
					{row.original.submittedAt
						? new Date(row.original.submittedAt).toLocaleDateString("fr-FR")
						: "—"}
				</span>
			),
		},
	];
}
