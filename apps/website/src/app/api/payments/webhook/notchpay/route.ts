import { createHmac, timingSafeEqual } from "node:crypto";
import configPromise from "@payload-config";
import { getPayload } from "payload";
import { getNotchPayProvider } from "@/lib/payments/notchpay";

interface NotchPayWebhookEvent {
	id: string;
	event: string;
	data: {
		merchant_reference: string;
		trxref: string;
		reference: string;
		amount: number;
		currency: string;
		status: string;
		customer: string;
		created_at: string;
	};
}

export async function POST(request: Request) {
	const rawBody = await request.text();
	const headers = Object.fromEntries(request.headers.entries());

	const hashKey = process.env.NOTCHPAY_HASH_KEY;
	if (!hashKey) {
		console.error("[notchpay webhook] NOTCHPAY_HASH_KEY not configured");
		return Response.json({ error: "Server misconfiguration" }, { status: 500 });
	}

	const signature = headers["x-notch-signature"];
	if (!signature) {
		return Response.json({ error: "Missing signature" }, { status: 400 });
	}

	const expected = createHmac("sha256", hashKey).update(rawBody).digest("hex");

	try {
		const sigBuf = Buffer.from(signature, "hex");
		const expBuf = Buffer.from(expected, "hex");
		if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
			console.warn(`[notchpay webhook] Invalid signature — got: ${signature}`);
			return Response.json({ error: "Invalid signature" }, { status: 400 });
		}
	} catch {
		return Response.json({ error: "Invalid signature" }, { status: 400 });
	}

	let event: NotchPayWebhookEvent;
	try {
		event = JSON.parse(rawBody) as NotchPayWebhookEvent;
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const merchantRef =
		event.data?.merchant_reference || event.data?.trxref || "";
	const eventType = event.event ?? "";

	console.log(
		`[notchpay webhook] event=${eventType} ref=${merchantRef} status=${event.data?.status}`,
	);

	if (eventType === "payment.complete") {
		await markCompleted(merchantRef).catch((err) =>
			console.error("[notchpay webhook] markCompleted error:", err),
		);
	} else if (
		eventType === "payment.failed" ||
		eventType === "payment.cancelled"
	) {
		await markFailed(merchantRef).catch((err) =>
			console.error("[notchpay webhook] markFailed error:", err),
		);
	}

	return Response.json({ received: true });
}

async function markCompleted(merchantRef: string): Promise<void> {
	if (!merchantRef) return;

	const paymentId = merchantRef.replace(/^TKAMS-/, "");
	const payload = await getPayload({ config: configPromise });

	const payment = await payload
		.findByID({ collection: "payments", id: paymentId })
		.catch(() => null);

	if (!payment) {
		console.error(`[notchpay webhook] Payment not found: ${paymentId}`);
		return;
	}
	if (payment.status === "completed") return;

	// Double-check with NotchPay API before marking paid
	try {
		const provider = getNotchPayProvider();
		const status = await provider.verifyPayment(
			payment.providerReference ?? merchantRef,
		);
		if (status !== "completed") {
			console.warn(
				`[notchpay webhook] Verify returned ${status} for ${paymentId} — skipping`,
			);
			return;
		}
	} catch (err) {
		console.warn(
			`[notchpay webhook] Verify failed for ${paymentId}: ${err} — trusting event`,
		);
	}

	await payload.update({
		collection: "payments",
		id: paymentId,
		data: { status: "completed" },
	});

	const invoiceId =
		typeof payment.invoice === "object"
			? (payment.invoice as { id: string }).id
			: String(payment.invoice);

	await payload.update({
		collection: "invoices",
		id: invoiceId,
		data: { status: "paid" },
	});

	console.log(
		`[notchpay webhook] Invoice ${invoiceId} marked paid via payment ${paymentId}`,
	);

	const { activateSubscriptionForInvoice } = await import("@/lib/billing");
	await activateSubscriptionForInvoice(invoiceId, payload).catch(console.error);
}

async function markFailed(merchantRef: string): Promise<void> {
	if (!merchantRef) return;
	const paymentId = merchantRef.replace(/^TKAMS-/, "");
	const payload = await getPayload({ config: configPromise });
	await payload
		.update({
			collection: "payments",
			id: paymentId,
			data: { status: "failed" },
		})
		.catch(() => null);
}
