import configPromise from "@payload-config";
import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import { getRequestUser } from "@/lib/get-request-user";
import { getNotchPayProvider } from "@/lib/payments/notchpay";

export async function POST(request: NextRequest) {
	try {
		const user = await getRequestUser(request);
		if (!user) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await request.json()) as { invoiceId?: string };
		if (!body.invoiceId) {
			return Response.json({ error: "invoiceId required" }, { status: 400 });
		}

		const payload = await getPayload({ config: configPromise });

		const invoice = await payload
			.findByID({ collection: "invoices", id: body.invoiceId })
			.catch(() => null);

		if (!invoice) {
			return Response.json({ error: "Invoice not found" }, { status: 404 });
		}

		const clientId =
			typeof invoice.client === "object"
				? (invoice.client as { id: string }).id
				: invoice.client;

		if (String(clientId) !== String(user.id)) {
			return Response.json({ error: "Forbidden" }, { status: 403 });
		}

		if (invoice.status === "paid") {
			return Response.json({ error: "Invoice already paid" }, { status: 409 });
		}

		const serverUrl =
			process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

		const provider = getNotchPayProvider();

		const payment = await payload.create({
			collection: "payments",
			// biome-ignore lint/suspicious/noExplicitAny: Payload draft type inference
			data: {
				reference: "pending",
				invoice: body.invoiceId,
				client: String(user.id),
				amount: invoice.amount ?? 0,
				currency: invoice.currency ?? "XAF",
				status: "pending",
			} as any,
		});

		const reference = `TKAMS-${payment.id}`;
		const callbackUrl = `${serverUrl}/api/payments/callback?paymentId=${payment.id}`;

		const result = await provider.createPayment({
			reference,
			amount: invoice.amount ?? 0,
			currency: invoice.currency ?? "XAF",
			description: `Facture TKAMS #${invoice.invoiceNumber ?? body.invoiceId}`,
			callbackUrl,
			customer: { email: user.email },
		});

		await payload.update({
			collection: "payments",
			id: payment.id,
			data: {
				reference,
				providerReference: result.providerReference,
				checkoutUrl: result.checkoutUrl,
			},
		});

		return Response.json({ checkoutUrl: result.checkoutUrl });
	} catch (err) {
		console.error("[payments/initiate]", err);
		return Response.json(
			{ error: "Payment initiation failed" },
			{ status: 500 },
		);
	}
}
