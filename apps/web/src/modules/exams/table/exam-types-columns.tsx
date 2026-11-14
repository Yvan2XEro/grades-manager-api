import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import type { ExamTypeRow } from "../types";

export function getExamTypesColumns(t: TFunction): ColumnDef<ExamTypeRow>[] {
	return [
		{
			id: "name",
			header: t("admin.examTypes.table.name"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "description",
			header: t("admin.examTypes.table.descriptionColumn"),
			cell: ({ row }) => row.original.description || "—",
		},
		{
			id: "defaultPercentage",
			header: t("admin.examTypes.table.defaultPercentage"),
			meta: { className: "w-40" },
			cell: ({ row: { original: type } }) =>
				type.defaultPercentage != null ? `${type.defaultPercentage}%` : "—",
		},
	];
}
