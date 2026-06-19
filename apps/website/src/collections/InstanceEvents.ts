import type { CollectionConfig } from "payload";

export const InstanceEvents: CollectionConfig = {
	slug: "instance-events",
	admin: {
		useAsTitle: "eventType",
		defaultColumns: ["instance", "eventType", "actorEmail", "createdAt"],
		group: "Instances",
	},
	access: {
		read: ({ req }) => !!req.user,
		create: () => true,
		update: () => false,
		delete: ({ req }) => !!req.user,
	},
	fields: [
		{
			name: "instance",
			type: "relationship",
			relationTo: "instance-requests",
			label: "Instance",
			required: true,
		},
		{
			name: "eventType",
			type: "select",
			label: "Event type",
			required: true,
			options: [
				{ label: "Provisioned", value: "provisioned" },
				{ label: "Restarted", value: "restarted" },
				{ label: "Stopped", value: "stopped" },
				{ label: "Started", value: "started" },
				{ label: "Upgraded", value: "upgraded" },
				{ label: "Delete attempted", value: "delete_attempted" },
				{ label: "Failed", value: "failed" },
			],
		},
		{
			name: "actorEmail",
			type: "email",
			label: "Actor email",
		},
		{
			name: "meta",
			type: "json",
			label: "Metadata",
			required: false,
		},
	],
	timestamps: true,
};
