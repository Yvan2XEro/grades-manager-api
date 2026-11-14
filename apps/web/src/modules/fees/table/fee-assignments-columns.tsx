import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { TFunction } from "i18next";
import { AssignmentStatusBadge } from "../components/status-badges";
import { formatAmount, getStudentName } from "../services/fee-format";
import type { FeeAssignmentRow } from "../types";

/** Columns of a fee assignments list; the year column is optional. */
export function getFeeAssignmentsColumns(
	t: TFunction,
	{ showYear = true }: { showYear?: boolean } = {},
): ColumnDef<FeeAssignmentRow>[] {
	return [
		{
			id: "student",
			header: t("feeClearance.assignments.fields.student"),
			cell: ({ row }) => (
				<span className="font-medium">{getStudentName(row.original)}</span>
			),
		},
		...(showYear
			? [
					{
						id: "academicYear",
						header: t("feeClearance.structures.fields.academicYear"),
						cell: ({ row }) => row.original.academicYear?.name ?? "—",
					} satisfies ColumnDef<FeeAssignmentRow>,
				]
			: []),
		{
			id: "effectiveAmount",
			header: t("feeClearance.assignments.fields.effectiveAmount"),
			cell: ({ row }) =>
				formatAmount(row.original.effectiveAmount, row.original.currency),
		},
		{
			id: "status",
			header: t("feeClearance.assignments.fields.status"),
			cell: ({ row }) => (
				<AssignmentStatusBadge status={row.original.status} withIcon />
			),
		},
		{
			id: "clearedAt",
			header: t("feeClearance.assignments.fields.clearedAt"),
			cell: ({ row }) =>
				row.original.clearedAt
					? format(new Date(row.original.clearedAt), "dd/MM/yyyy")
					: "—",
		},
	];
}
