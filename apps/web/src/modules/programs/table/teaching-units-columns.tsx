import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import type { TeachingUnitRow } from "../types";

export function getTeachingUnitsColumns(
	t: TFunction,
	programNames: Map<string, string>,
): ColumnDef<TeachingUnitRow>[] {
	return [
		{
			id: "code",
			header: t("admin.teachingUnits.table.code"),
			meta: { className: "w-[14%]" },
			cell: ({ row }) => (
				<ClipboardCopy
					value={row.original.code}
					label={t("admin.teachingUnits.table.code", { defaultValue: "Code" })}
				/>
			),
		},
		{
			id: "name",
			header: t("admin.teachingUnits.table.name"),
			meta: { className: "w-[32%]" },
			cell: ({ row }) => (
				<span className="block truncate font-medium" title={row.original.name}>
					{row.original.name}
				</span>
			),
		},
		{
			id: "program",
			header: t("admin.teachingUnits.table.program"),
			meta: { className: "w-[28%]" },
			cell: ({ row }) => {
				const name = programNames.get(row.original.programId);
				return name ? (
					<p className="truncate" title={name}>
						{name}
					</p>
				) : (
					t("common.labels.notAvailable", { defaultValue: "N/A" })
				);
			},
		},
		{
			id: "semester",
			header: t("admin.teachingUnits.table.semester"),
			meta: { className: "w-[14%]" },
			cell: ({ row: { original: unit } }) =>
				t(`admin.teachingUnits.semesters.${unit.semester}`, {
					defaultValue: unit.semester,
				}),
		},
		{
			id: "credits",
			header: t("admin.teachingUnits.table.credits"),
			meta: { className: "w-[12%]" },
			cell: ({ row }) => row.original.credits,
		},
	];
}
