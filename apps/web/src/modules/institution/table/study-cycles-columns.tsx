import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import type { StudyCycleRow } from "../types";

export function getStudyCyclesColumns(
	t: TFunction,
): ColumnDef<StudyCycleRow>[] {
	return [
		{
			id: "name",
			header: t("admin.studyCycles.table.name", { defaultValue: "Name" }),
			cell: ({ row }) => (
				<span className="font-semibold text-foreground">
					{row.original.name}
				</span>
			),
		},
		{
			id: "credits",
			header: t("admin.studyCycles.table.credits", {
				defaultValue: "Credits",
			}),
			meta: { className: "w-20" },
			cell: ({ row }) => row.original.totalCreditsRequired,
		},
		{
			id: "duration",
			header: t("admin.studyCycles.table.duration", {
				defaultValue: "Duration",
			}),
			meta: { className: "w-28" },
			cell: ({ row }) =>
				t("admin.studyCycles.table.years", {
					defaultValue: "{{value}} years",
					value: row.original.durationYears,
				}),
		},
	];
}
