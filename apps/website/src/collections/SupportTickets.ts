import type { CollectionConfig } from "payload";

export const SupportTickets: CollectionConfig = {
	slug: "support-tickets",
	admin: {
		useAsTitle: "subject",
		defaultColumns: ["subject", "from", "instance", "status", "createdAt"],
		group: "Support",
	},
	access: {
		read: ({ req }) => !!req.user,
		create: () => true,
		update: ({ req }) => !!req.user,
		delete: ({ req }) => {
			const user = req.user as { role?: string } | null;
			return user?.role === "admin";
		},
	},
	fields: [
		{
			name: "subject",
			type: "text",
			required: true,
			label: "Subject",
		},
		{
			name: "message",
			type: "textarea",
			required: true,
			label: "Message",
		},
		{
			name: "from",
			type: "relationship",
			relationTo: "users",
			label: "From",
			admin: { readOnly: true },
		},
		{
			name: "instance",
			type: "relationship",
			relationTo: "instance-requests",
			label: "Related instance",
			required: false,
		},
		{
			name: "status",
			type: "select",
			label: "Status",
			defaultValue: "open",
			options: [
				{ label: "Open", value: "open" },
				{ label: "In progress", value: "in_progress" },
				{ label: "Resolved", value: "resolved" },
			],
		},
		{
			name: "adminNotes",
			type: "textarea",
			label: "Admin notes (internal)",
			admin: {
				description: "Internal notes — not visible to the client.",
			},
		},
	],
	timestamps: true,
};
