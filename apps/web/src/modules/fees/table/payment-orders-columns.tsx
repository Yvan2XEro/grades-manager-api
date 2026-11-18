import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { formatDate } from "@/lib/date-format";
import { OrderStatusBadge } from "../components/status-badges";
import { formatMoney } from "../services/fee-format";
import type { PaymentOrder } from "../types";

export function getPaymentOrdersColumns(
	t: TFunction,
	currency: string,
): ColumnDef<PaymentOrder>[] {
	return [
		{
			id: "createdAt",
			header: t("feeClearance.orders.fields.createdAt"),
			cell: ({ row }) => formatDate(row.original.createdAt, "PPp"),
		},
		{
			id: "reference",
			header: t("feeClearance.orders.fields.reference"),
			cell: ({ row }) => (
				<span className="font-mono text-xs">
					{row.original.reference ?? "—"}
				</span>
			),
		},
		{
			id: "amount",
			header: t("feeClearance.orders.fields.amount"),
			cell: ({ row }) => (
				<span className="font-medium">
					{formatMoney(Number(row.original.amount), currency)}
				</span>
			),
		},
		{
			id: "status",
			header: t("feeClearance.orders.fields.status"),
			cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
		},
		{
			id: "notes",
			header: t("feeClearance.orders.fields.notes"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.notes ?? "—"}
				</span>
			),
		},
	];
}
