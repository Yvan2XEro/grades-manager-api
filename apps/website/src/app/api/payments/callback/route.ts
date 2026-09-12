import configPromise from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import { getNotchPayProvider } from "@/lib/payments/notchpay";
import { relationId } from "@/lib/relation";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const paymentId = searchParams.get("paymentId");

	if (!paymentId) {
		redirect("/dashboard/billing?payment=error");
	}
	const payload = await getPayload({ config: configPromise });
	const payment = await payload
		.findByID({ collection: "payments", id: paymentId })
		.catch(() => null);

	if (!payment) {
		redirect("/dashboard/billing?payment=error");
	}

	// If already resolved, redirect immediately
	if (payment.status === "completed") {
		redirect("/dashboard/billing?payment=success");
	}
	if (payment.status === "failed" || payment.status === "cancelled") {
		redirect("/dashboard/billing?payment=failed");
	}

	// Verify with NotchPay API (callback may arrive before webhook)
	try {
		const provider = getNotchPayProvider();
		const status = await provider.verifyPayment(
			payment.providerReference ?? `TKAMS-${paymentId}`,
		);

		if (status === "completed") {
			await payload.update({
				collection: "payments",
				id: paymentId,
				data: { status: "completed" },
			});

			const invoiceId = relationId(payment.invoice);
			if (invoiceId === null) {
				console.error("Paiement sans facture liee", payment.id);
				return;
			}

			await payload.update({
				collection: "invoices",
				id: invoiceId,
				data: { status: "paid" },
			});

			// Activate subscription — webhook may not have fired yet
			const { activateSubscriptionForInvoice } = await import("@/lib/billing");
			await activateSubscriptionForInvoice(invoiceId, payload).catch(
				console.error,
			);

			redirect("/dashboard/billing?payment=success");
		}

		if (status === "failed" || status === "cancelled") {
			await payload.update({
				collection: "payments",
				id: paymentId,
				data: { status },
			});
			redirect("/dashboard/billing?payment=failed");
		}
	} catch {
		// Verify failed — could be temporary; show pending page
	}

	redirect("/dashboard/billing?payment=pending");
}
