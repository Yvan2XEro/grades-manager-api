import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ExportTemplate } from "@/utils/type";
import { getExportTypeLabel } from "../types";

export function getExportTemplatesColumns(
	t: TFunction,
): ColumnDef<ExportTemplate>[] {
	return [
		{
			id: "name",
			header: t("admin.exportTemplates.table.name"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "type",
			header: t("admin.exportTemplates.table.type"),
			meta: { className: "w-40" },
			cell: ({ row }) => (
				<Badge variant="outline">{getExportTypeLabel(row.original.type)}</Badge>
			),
		},
		{
			id: "status",
			header: t("admin.exportTemplates.table.status"),
			meta: { className: "w-32" },
			cell: ({ row }) =>
				row.original.isDefault ? (
					<Badge className="bg-yellow-500">
						<Star className="mr-1 h-3 w-3" />
						{t("admin.exportTemplates.table.default")}
					</Badge>
				) : (
					<Badge variant="secondary">
						{t("admin.exportTemplates.table.custom")}
					</Badge>
				),
		},
	];
}
