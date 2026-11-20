import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import type { StudyCycleRow } from "../types";

export function getStudyCyclesColumns(
	t: TFunction,
): ColumnDef<StudyCycleRow>[] {
	return [
		{
			id: "name",
			header: t("admin.studyCycles.table.name"),
			cell: ({ row }) => (
				<span className="font-semibold text-foreground">
					{row.original.name}
					{row.original.code && (
						<span className="ml-2 font-mono font-normal text-muted-foreground text-xs">
							{row.original.code}
						</span>
					)}
				</span>
			),
		},
		{
			id: "credits",
			header: t("admin.studyCycles.table.credits"),
			meta: { className: "w-20" },
			cell: ({ row }) => row.original.totalCreditsRequired,
		},
		{
			id: "duration",
			header: t("admin.studyCycles.table.duration"),
			meta: { className: "w-28" },
			cell: ({ row }) =>
				t("admin.studyCycles.table.years", {
					value: row.original.durationYears,
				}),
		},
	];
}
