import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { TFunction } from "i18next";
import { formatMoney } from "../services/fee-format";
import type { FeePayment } from "../types";

export function getPaymentsColumns(
	t: TFunction,
	currency: string,
): ColumnDef<FeePayment>[] {
	return [
		{
			id: "paymentDate",
			header: t("feeClearance.payments.fields.paymentDate"),
			cell: ({ row }) =>
				format(new Date(row.original.paymentDate), "dd/MM/yyyy"),
		},
		{
			id: "amount",
			header: t("feeClearance.payments.fields.amount"),
			cell: ({ row }) => (
				<span className="font-medium">
					{formatMoney(Number(row.original.amount), currency)}
				</span>
			),
		},
		{
			id: "paymentMethod",
			header: t("feeClearance.payments.fields.paymentMethod"),
			cell: ({ row }) =>
				t(`feeClearance.payments.methods.${row.original.paymentMethod}`),
		},
		{
			id: "reference",
			header: t("feeClearance.payments.fields.reference"),
			cell: ({ row }) => row.original.reference ?? "—",
		},
	];
}
