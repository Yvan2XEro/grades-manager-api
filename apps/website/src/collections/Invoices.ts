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
			required: true,
			admin: { description: "Ex : INV-2026-001" },
		},
		{
			name: "client",
			type: "relationship",
			relationTo: "users",
			required: true,
		},
		{
			name: "instance",
			type: "relationship",
			relationTo: "instance-requests",
			admin: { description: "Instance concernée (optionnel)" },
		},
		{
			name: "amount",
			type: "number",
			required: true,
			admin: { description: "Montant en unités de la devise" },
		},
		{
			name: "currency",
			type: "text",
			defaultValue: "FCFA",
			required: true,
		},
		{
			name: "status",
			type: "select",
			defaultValue: "unpaid",
			required: true,
			options: [
				{ label: "Payée", value: "paid" },
				{ label: "En attente", value: "unpaid" },
				{ label: "Annulée", value: "cancelled" },
			],
		},
		{
			name: "period",
			type: "text",
			admin: { description: "Ex : Janvier 2026 – Décembre 2026" },
		},
		{
			name: "description",
			type: "text",
		},
		{
			name: "pdfUrl",
			type: "text",
			label: "URL PDF",
			admin: { description: "Lien de téléchargement de la facture PDF" },
		},
		{
			name: "dueDate",
			type: "date",
			label: "Date d'échéance",
		},
	],
	timestamps: true,
};
