import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { RetakeReasonBadge } from "../components/retake-reason-badge";
import type { EligibilityRow } from "../types";

const centered = (label: string) => () => (
	<span className="block text-center">{label}</span>
);

export function getRetakeEligibilityColumns(
	t: TFunction,
): ColumnDef<EligibilityRow>[] {
	return [
		{
			id: "student",
			header: t("admin.retake.table.student"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.studentName}</span>
			),
		},
		{
			id: "registrationNumber",
			header: t("admin.retake.table.registrationNumber"),
			cell: ({ row }) => row.original.registrationNumber,
		},
		{
			id: "attempt",
			header: centered(t("admin.retake.table.attempt")),
			cell: ({ row }) => (
				<div className="text-center">{row.original.attempt}</div>
			),
		},
		{
			id: "grade",
			header: centered(t("admin.retake.table.grade")),
			cell: ({ row: { original: row } }) => (
				<div className="text-center">
					{row.grade !== null ? (
						<span
							className={
								row.grade < 10
									? "font-medium text-destructive"
									: "font-medium text-green-600"
							}
						>
							{row.grade.toFixed(2)}
						</span>
					) : (
						<span className="text-muted-foreground">—</span>
					)}
				</div>
			),
		},
		{
			id: "reasons",
			header: t("admin.retake.table.reasons"),
			cell: ({ row }) => (
				<div className="flex flex-wrap gap-1">
					{row.original.reasons.map((reason) => (
						<RetakeReasonBadge key={reason} reason={reason} />
					))}
				</div>
			),
		},
	];
}
