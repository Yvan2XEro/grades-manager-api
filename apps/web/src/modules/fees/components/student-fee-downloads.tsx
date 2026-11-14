import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { downloadBase64 } from "@/lib/download";
import { trpcClient } from "@/utils/trpc";

function PdfDownloadButton({
	label,
	fetchPdf,
	filename,
}: {
	label: string;
	fetchPdf: () => Promise<{ pdf: string }>;
	filename: string;
}) {
	const [pending, setPending] = useState(false);

	async function handleDownload() {
		setPending(true);
		try {
			const result = await fetchPdf();
			downloadBase64(result.pdf, filename, "application/pdf");
		} finally {
			setPending(false);
		}
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleDownload}
			disabled={pending}
		>
			{pending ? (
				<Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
			) : (
				<Download className="mr-1 h-3.5 w-3.5" />
			)}
			{label}
		</Button>
	);
}

/** Downloads the student's own payment order PDF. */
export function DownloadOrderButton({
	orderId,
	reference,
}: {
	orderId: string;
	reference: string | null;
}) {
	const { t } = useTranslation();
	return (
		<PdfDownloadButton
			label={t("feeClearance.orders.download")}
			fetchPdf={() =>
				trpcClient.feeClearance.myDownloadOrder.query({ orderId })
			}
			filename={`order-${reference ?? orderId}.pdf`}
		/>
	);
}

/** Downloads the student's own payment receipt PDF. */
export function DownloadReceiptButton({
	paymentId,
	reference,
}: {
	paymentId: string;
	reference: string | null;
}) {
	const { t } = useTranslation();
	return (
		<PdfDownloadButton
			label={t("feeClearance.payments.downloadReceipt")}
			fetchPdf={() =>
				trpcClient.feeClearance.myDownloadReceipt.query({ paymentId })
			}
			filename={`receipt-${reference ?? paymentId}.pdf`}
		/>
	);
}
