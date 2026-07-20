import type { Payload } from "payload";

/**
 * Finds or creates the subscription linked to an invoice and marks it active.
 * Safe to call multiple times (webhook + callback race): the email is only sent
 * when the subscription transitions to active, not on subsequent calls.
 */
export async function activateSubscriptionForInvoice(
	invoiceId: string,
	payload: Payload,
): Promise<void> {
	const invoice = await payload
		.findByID({ collection: "invoices", id: invoiceId, depth: 1 })
		.catch(() => null);
	if (!invoice) return;

	const instanceId =
		typeof invoice.instance === "object"
			? (invoice.instance as { id: string }).id
			: (invoice.instance as string | null | undefined);
	const clientId =
		typeof invoice.client === "object"
			? (invoice.client as { id: string }).id
			: (invoice.client as string);

	if (!instanceId || !clientId) return;

	const existing = await payload.find({
		collection: "subscriptions",
		where: { instance: { equals: instanceId } },
		limit: 1,
	});

	// Track whether this call actually changed state — only send email if it did
	let justActivated = false;

	if (existing.docs.length > 0) {
		if (existing.docs[0].status !== "active") {
			await payload.update({
				collection: "subscriptions",
				id: existing.docs[0].id,
				data: { status: "active" },
			});
			justActivated = true;
		}
	} else {
		const renewalDate = new Date();
		renewalDate.setFullYear(renewalDate.getFullYear() + 1);
		await payload.create({
			collection: "subscriptions",
			data: {
				plan: "standard",
				client: clientId,
				instance: instanceId,
				status: "active",
				annualAmount: invoice.amount ?? 0,
				currency: (invoice.currency as string) ?? "XAF",
				renewalDate: renewalDate.toISOString(),
			},
		});
		justActivated = true;
	}

	if (!justActivated) return;

	const clientField = invoice.client as
		| { id?: string; name?: string; email?: string }
		| string;
	const clientEmail =
		typeof clientField === "object" ? clientField?.email : null;
	const clientName = typeof clientField === "object" ? clientField?.name : null;
	if (!clientEmail) return;

	const instanceField = invoice.instance as
		| { orgName?: string }
		| string
		| null;
	const orgName =
		typeof instanceField === "object" ? (instanceField?.orgName ?? "") : "";

	const { paymentConfirmedEmailHTML } = await import("./email-templates");
	await payload
		.sendEmail({
			to: clientEmail,
			subject: "TKAMS — Payment confirmed",
			html: paymentConfirmedEmailHTML({
				userName: clientName ?? clientEmail,
				orgName,
				amount: invoice.amount ?? 0,
				currency: (invoice.currency as string) ?? "XAF",
				invoiceNumber: String(invoice.invoiceNumber ?? invoiceId),
			}),
		})
		.catch(console.error);
}
