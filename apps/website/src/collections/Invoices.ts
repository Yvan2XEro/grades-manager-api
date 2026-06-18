import type { CollectionConfig } from "payload";

export const Invoices: CollectionConfig = {
	slug: "invoices",
	admin: {
		useAsTitle: "invoiceNumber",
		defaultColumns: [
			"invoiceNumber",
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
		update: ({ req }) => !!req.user,
		delete: ({ req }) => !!req.user,
	},
	fields: [
		{
			name: "invoiceNumber",
			type: "text",
			label: "Invoice Number",
			required: true,
			admin: { description: "e.g. INV-2026-001" },
		},
		{
			name: "client",
			type: "relationship",
			relationTo: "users",
			label: "Client",
			required: true,
		},
		{
			name: "instance",
			type: "relationship",
			relationTo: "instance-requests",
			label: "Related Instance",
			admin: { description: "Leave blank for non-instance invoices" },
		},
		{
			name: "amount",
			type: "number",
			label: "Amount",
			required: true,
			admin: { description: "Amount in the invoice currency" },
		},
		{
			name: "currency",
			type: "text",
			label: "Currency",
			defaultValue: "FCFA",
			required: true,
		},
		{
			name: "status",
			type: "select",
			label: "Status",
			defaultValue: "unpaid",
			required: true,
			options: [
				{ label: "Paid", value: "paid" },
				{ label: "Unpaid", value: "unpaid" },
				{ label: "Cancelled", value: "cancelled" },
			],
		},
		{
			name: "period",
			type: "text",
			label: "Billing Period",
			admin: { description: "e.g. January 2026 – December 2026" },
		},
		{
			name: "description",
			type: "text",
			label: "Description",
		},
		{
			name: "pdfUrl",
			type: "text",
			label: "PDF URL",
			admin: { description: "Download link for the invoice PDF" },
		},
		{
			name: "dueDate",
			type: "date",
			label: "Due Date",
		},
	],
	timestamps: true,
};
