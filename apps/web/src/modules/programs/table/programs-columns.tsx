import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import type { ProgramRow } from "../types";

export function getProgramsColumns(
	t: TFunction,
	cycleNames: Map<string, string>,
): ColumnDef<ProgramRow>[] {
	return [
		{
			id: "code",
			header: t("admin.programs.table.code", { defaultValue: "Code" }),
			cell: ({ row }) => (
				<ClipboardCopy
					value={row.original.code}
					label={t("admin.programs.table.code", { defaultValue: "Code" })}
				/>
			),
		},
		{
			id: "name",
			header: t("admin.programs.table.name"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "cycle",
			header: t("admin.programs.table.cycle", { defaultValue: "Cycle" }),
			cell: ({ row: { original: program } }) => (
				<span className="text-muted-foreground text-sm">
					{program.cycleId ? cycleNames.get(program.cycleId) : "—"}
				</span>
			),
		},
		{
			id: "description",
			header: t("admin.programs.table.description"),
			cell: ({ row }) =>
				row.original.description || (
					<span className="text-muted-foreground italic">
						{t("admin.programs.table.noDescription")}
					</span>
				),
		},
		{
			id: "options",
			header: () => (
				<div className="text-center">
					{t("admin.programs.table.options", { defaultValue: "Options" })}
				</div>
			),
			cell: ({ row }) => (
				<div className="text-center">{row.original.optionsCount}</div>
			),
		},
	];
}
