import type { CollectionConfig } from "payload";

export const Payments: CollectionConfig = {
	slug: "payments",
	admin: {
		useAsTitle: "reference",
		defaultColumns: [
			"reference",
			"method",
			"invoice",
			"client",
			"amount",
			"status",
			"createdAt",
		],
		group: "Billing",
	},
	access: {
		read: ({ req }) => {
			if (!req.user) return false;
			if ((req.user as { role?: string }).role === "super_admin") return true;
			return { client: { equals: req.user.id } };
		},
		create: ({ req }) => !!req.user,
		update: () => true,
		delete: ({ req }) => {
			if (!req.user) return false;
			return (req.user as { role?: string }).role === "super_admin";
		},
	},
	hooks: {
		afterChange: [
			async ({ doc, previousDoc, req, operation }) => {
				// Activate subscription when admin marks a cash payment as completed
				if (
					doc.method === "cash" &&
					doc.status === "completed" &&
					(operation === "create" ||
						(operation === "update" && previousDoc?.status !== "completed"))
				) {
					const invoiceId =
						typeof doc.invoice === "object"
							? (doc.invoice as { id: string }).id
							: String(doc.invoice);

					await req.payload
						.update({
							collection: "invoices",
							id: invoiceId,
							data: { status: "paid" },
							req,
						})
						.catch(console.error);

					const { activateSubscriptionForInvoice } = await import(
						"../lib/billing"
					);
					await activateSubscriptionForInvoice(invoiceId, req.payload).catch(
						console.error,
					);
				}
			},
		],
	},
	fields: [
		{
			name: "method",
			type: "select",
			label: "Payment Method",
			defaultValue: "notchpay",
			required: true,
			options: [
				{ label: "NotchPay (online)", value: "notchpay" },
				{ label: "Cash / transfer", value: "cash" },
			],
		},
		{
			name: "reference",
			type: "text",
			label: "Internal Reference",
			required: true,
			admin: { description: "e.g. TKAMS-{id} or CASH-{year}-{seq}" },
		},
		{
			name: "invoice",
			type: "relationship",
			relationTo: "invoices",
			label: "Invoice",
			required: true,
		},
		{
			name: "client",
			type: "relationship",
			relationTo: "users",
			label: "Client",
			required: true,
		},
		{
			name: "amount",
			type: "number",
			label: "Amount",
			required: true,
		},
		{
			name: "currency",
			type: "text",
			label: "Currency",
			defaultValue: "XAF",
			required: true,
		},
		{
			name: "status",
			type: "select",
			label: "Status",
			defaultValue: "pending",
			required: true,
			options: [
				{ label: "Pending", value: "pending" },
				{ label: "Completed", value: "completed" },
				{ label: "Failed", value: "failed" },
				{ label: "Cancelled", value: "cancelled" },
			],
		},
		{
			name: "paidAt",
			type: "date",
			label: "Payment date",
			admin: {
				condition: (data) => data?.method === "cash",
				description: "Date the cash payment was collected",
				date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" },
			},
		},
		{
			name: "adminNotes",
			type: "textarea",
			label: "Admin notes",
			admin: {
				condition: (data) => data?.method === "cash",
				description: "Internal notes about this cash payment",
			},
		},
		{
			name: "providerReference",
			type: "text",
			label: "Provider Reference",
			admin: {
				condition: (data) => data?.method === "notchpay",
				description: "Reference assigned by NotchPay",
			},
		},
		{
			name: "checkoutUrl",
			type: "text",
			label: "Checkout URL",
			admin: {
				condition: (data) => data?.method === "notchpay",
				readOnly: true,
				description: "One-time NotchPay checkout link (expires after use)",
			},
		},
	],
	timestamps: true,
};
