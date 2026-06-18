import type { CollectionConfig } from "payload";

export const Payments: CollectionConfig = {
	slug: "payments",
	admin: {
		useAsTitle: "reference",
		defaultColumns: [
			"reference",
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
	fields: [
		{
			name: "reference",
			type: "text",
			label: "Internal Reference",
			required: true,
			admin: { readOnly: true, description: "e.g. TKAMS-{id}" },
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
			admin: { readOnly: true },
		},
		{
			name: "amount",
			type: "number",
			label: "Amount",
			required: true,
			admin: { readOnly: true },
		},
		{
			name: "currency",
			type: "text",
			label: "Currency",
			defaultValue: "XAF",
			required: true,
			admin: { readOnly: true },
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
			name: "providerReference",
			type: "text",
			label: "Provider Reference",
			admin: {
				readOnly: true,
				description: "Reference assigned by NotchPay",
			},
		},
		{
			name: "checkoutUrl",
			type: "text",
			label: "Checkout URL",
			admin: { readOnly: true },
		},
	],
	timestamps: true,
};
