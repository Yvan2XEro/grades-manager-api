import { CheckCircle, Download, FileText, Trash2, XCircle } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { trpcClient } from "@/utils/trpc";
import { AssignmentBalanceSummary } from "../components/assignment-balance-summary";
import { AssignmentDetailHeader } from "../components/assignment-detail-header";
import { ConfirmOrderDialog } from "../components/confirm-order-dialog";
import {
	useCancelOrder,
	useDeletePayment,
	useFeeAssignment,
	usePdfDownload,
} from "../hooks/use-fee-assignment";
import { getPaymentOrdersColumns } from "../table/payment-orders-columns";
import { getPaymentsColumns } from "../table/payments-columns";
import type { FeePayment, PaymentOrder } from "../types";

export default function FeeAssignmentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const { assignment, isLoading, payments, orders, invalidate } =
		useFeeAssignment(id!);
	const cancelOrder = useCancelOrder(invalidate);
	const deletePayment = useDeletePayment(invalidate);
	const orderPdf = usePdfDownload((orderId) =>
		trpcClient.feeClearance.downloadOrder.query({ orderId }),
	);
	const receiptPdf = usePdfDownload((paymentId) =>
		trpcClient.feeClearance.downloadReceipt.query({ paymentId }),
	);

	const currency = assignment?.currency ?? "";
	const orderColumns = useMemo(
		() => getPaymentOrdersColumns(t, currency),
		[t, currency],
	);
	const paymentColumns = useMemo(
		() => getPaymentsColumns(t, currency),
		[t, currency],
	);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}
	if (!assignment) return null;

	const paidAmount =
		payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
	const balance = Number(assignment.effectiveAmount) - paidAmount;

	const orderActions = (o: PaymentOrder): RowAction[] => [
		{
			label: t("feeClearance.orders.download"),
			icon: Download,
			disabled: orderPdf.downloadingId === o.id,
			onSelect: () =>
				orderPdf.download(o.id, `bon-caisse-${o.reference ?? o.id}.pdf`),
		},
		...(o.status === "pending"
			? [
					{
						label: t("feeClearance.orders.confirm"),
						icon: CheckCircle,
						onSelect: () =>
							ConfirmOrderDialog.call({
								orderId: o.id,
								onConfirmed: invalidate,
							}),
					},
					{
						label: t("common.cancel"),
						icon: XCircle,
						destructive: true,
						onSelect: () => cancelOrder.mutate(o.id),
					},
				]
			: []),
	];

	const paymentActions = (p: FeePayment): RowAction[] => [
		{
			label: t("feeClearance.payments.downloadReceipt"),
			icon: FileText,
			disabled: receiptPdf.downloadingId === p.id,
			onSelect: () =>
				receiptPdf.download(p.id, `recu-${p.reference ?? p.id}.pdf`),
		},
		{
			label: t("common.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () =>
				confirmAction({
					title: t("common.confirmDelete"),
					message: t("feeClearance.payments.deleteConfirm"),
					confirmText: t("common.delete"),
					cancelText: t("common.cancel"),
					onConfirm: () =>
						deletePayment.mutateAsync(p.id).catch(() => undefined),
				}),
		},
	];

	return (
		<div className="space-y-6">
			<AssignmentDetailHeader
				assignment={assignment}
				balance={balance}
				onChanged={invalidate}
			/>
			<AssignmentBalanceSummary
				assignment={assignment}
				paidAmount={paidAmount}
				onChanged={invalidate}
			/>

			{orders.length > 0 && (
				<div className="space-y-3">
					<h3 className="font-semibold">{t("feeClearance.orders.title")}</h3>
					<DataTable
						columns={orderColumns}
						data={orders}
						rowActions={orderActions}
					/>
				</div>
			)}

			<div className="space-y-3">
				<h3 className="font-semibold">{t("feeClearance.payments.title")}</h3>
				{!payments?.length ? (
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.payments.empty")}
					</p>
				) : (
					<DataTable
						columns={paymentColumns}
						data={payments}
						rowActions={paymentActions}
					/>
				)}
			</div>
		</div>
	);
}
