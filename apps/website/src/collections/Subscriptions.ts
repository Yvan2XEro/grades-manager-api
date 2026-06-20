import type { CollectionConfig } from "payload";

export const Subscriptions: CollectionConfig = {
	slug: "subscriptions",
	admin: {
		useAsTitle: "plan",
		defaultColumns: ["plan", "client", "status", "renewalDate", "studentCount"],
		group: "Billing",
	},
	access: {
		read: ({ req }) => !!req.user,
		create: ({ req }) => !!req.user,
		update: ({ req }) => !!req.user,
		delete: ({ req }) => !!req.user,
	},
	fields: [
		{
			name: "plan",
			type: "select",
			label: "Plan",
			required: true,
			options: [
				{ label: "Standard", value: "standard" },
				{ label: "Pro", value: "pro" },
				{ label: "Enterprise", value: "enterprise" },
			],
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
			name: "instance",
			type: "relationship",
			relationTo: "instance-requests",
			label: "Linked instance",
			required: false,
		},
		{
			name: "studentCount",
			type: "number",
			label: "Student count",
			min: 0,
		},
		{
			name: "renewalDate",
			type: "date",
			label: "Renewal date",
			admin: {
				date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" },
			},
		},
		{
			name: "status",
			type: "select",
			label: "Status",
			defaultValue: "active",
			options: [
				{ label: "Active", value: "active" },
				{ label: "Suspended", value: "suspended" },
				{ label: "Cancelled", value: "cancelled" },
			],
		},
		{
			name: "annualAmount",
			type: "number",
			label: "Annual amount",
			min: 0,
		},
		{
			name: "currency",
			type: "text",
			label: "Currency",
			defaultValue: "XAF",
		},
		{
			name: "contractUrl",
			type: "text",
			label: "Contract URL",
			required: false,
		},
		{
			name: "notes",
			type: "textarea",
			label: "Admin notes (internal)",
		},
	],
	timestamps: true,
};
