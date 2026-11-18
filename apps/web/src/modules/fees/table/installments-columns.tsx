import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { formatDate } from "@/lib/date-format";
import { formatAmount } from "../services/fee-format";
import type { FeeInstallment } from "../types";

export function getInstallmentsColumns(
	t: TFunction,
	currency: string,
): ColumnDef<FeeInstallment>[] {
	return [
		{
			id: "label",
			header: t("feeClearance.structures.installments.label"),
			cell: ({ row }) => row.original.label,
		},
		{
			id: "amount",
			header: t("feeClearance.structures.installments.amount"),
			cell: ({ row }) => formatAmount(row.original.amount, currency),
		},
		{
			id: "dueDate",
			header: t("feeClearance.structures.installments.dueDate"),
			cell: ({ row }) =>
				row.original.dueDate ? formatDate(row.original.dueDate, "P") : "—",
		},
	];
}
