import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-format";
import { formatMoney } from "@/lib/money";
import { useReceiptDownload } from "../hooks/use-fee-assignment";
import type { RecordedPayment } from "../hooks/use-record-payment";

/** Confirmation of a recorded payment, with its receipt to hand over. */
export function PaymentRecorded({
	payment,
	studentName,
	onClose,
}: {
	payment: RecordedPayment;
	studentName: string;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const receipt = useReceiptDownload();
	const downloading = receipt.downloadingId === payment.paymentId;

	return (
		<div className="space-y-4">
			<div className="flex flex-col items-center gap-2 text-center">
				<CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
				<p className="font-semibold text-lg">
					{t("feeClearance.payments.success.title")}
				</p>
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.payments.success.description", {
						amount: formatMoney(payment.amount, payment.currency),
						name: studentName,
						date: formatDate(payment.paymentDate, "PP"),
					})}
				</p>
			</div>
			<div className="space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
				{payment.reference && (
					<p className="font-medium font-mono">
						{t("feeClearance.payments.success.receiptNumber", {
							number: payment.reference,
						})}
					</p>
				)}
				<p>
					{t("feeClearance.payments.success.remaining", {
						amount: formatMoney(payment.remaining, payment.currency),
					})}
				</p>
				{payment.assignedStructure && (
					<p className="text-muted-foreground">
						{t("feeClearance.payments.success.assigned", {
							structure: payment.assignedStructure,
						})}
					</p>
				)}
			</div>
			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button variant="outline" onClick={onClose}>
					{t("common.close")}
				</Button>
				<Button
					disabled={downloading}
					onClick={() =>
						receipt.download(
							payment.paymentId,
							`recu-${payment.reference ?? payment.paymentId}.pdf`,
						)
					}
				>
					{downloading ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<FileText className="mr-2 h-4 w-4" />
					)}
					{t("feeClearance.payments.downloadReceipt")}
				</Button>
			</div>
		</div>
	);
}
