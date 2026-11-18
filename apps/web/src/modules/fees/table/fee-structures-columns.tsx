import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "../services/fee-format";
import type { FeeStructureRow } from "../types";

export function getFeeStructuresColumns(
	t: TFunction,
): ColumnDef<FeeStructureRow>[] {
	return [
		{
			id: "name",
			header: t("feeClearance.structures.fields.name"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "academicYear",
			header: t("feeClearance.structures.fields.academicYear"),
			cell: ({ row }) => row.original.academicYear?.name ?? "—",
		},
		{
			id: "totalAmount",
			header: t("feeClearance.structures.fields.totalAmount"),
			cell: ({ row }) =>
				formatAmount(row.original.totalAmount, row.original.currency),
		},
		{
			id: "isActive",
			header: t("feeClearance.structures.fields.isActive"),
			cell: ({ row }) => (
				<Badge variant={row.original.isActive ? "default" : "secondary"}>
					{row.original.isActive ? t("common.active") : t("common.inactive")}
				</Badge>
			),
		},
	];
}
