import type { CollectionConfig } from "payload";

export const InstanceRequests: CollectionConfig = {
	slug: "instance-requests",
	admin: {
		useAsTitle: "orgName",
		defaultColumns: [
			"orgName",
			"subdomain",
			"status",
			"adminEmail",
			"createdAt",
		],
		group: "Instances",
	},
	access: {
		read: ({ req }) => !!req.user,
		create: () => true,
		update: ({ req }) => !!req.user,
		delete: ({ req }) => !!req.user,
	},
	hooks: {
		afterChange: [
			async ({ doc, previousDoc, operation, req }) => {
				if (
					operation === "update" &&
					doc.status === "approved" &&
					previousDoc?.status === "pending_approval" &&
					!doc.dokployProjectId
				) {
					const { deployToDokploy } = await import("@/lib/provision");
					deployToDokploy(String(doc.id), req.payload).catch(console.error);
				}
			},
		],
	},
	fields: [
		{
			name: "orgName",
			type: "text",
			label: "Institution Name",
			required: true,
		},
		{
			name: "client",
			type: "relationship",
			relationTo: "users",
			label: "Client",
			admin: { readOnly: true },
		},
		{
			name: "subdomain",
			type: "text",
			label: "Subdomain",
			required: true,
		},
		{
			name: "institutionType",
			type: "select",
			label: "Institution Type",
			options: [
				{ label: "University", value: "university" },
				{ label: "Grande École", value: "school" },
				{ label: "Institute", value: "institute" },
				{ label: "Secondary / High School", value: "secondary" },
				{ label: "Other", value: "other" },
			],
		},
		{
			name: "country",
			type: "text",
			label: "Country",
		},
		{
			name: "adminName",
			type: "text",
			label: "Admin Full Name",
		},
		{
			name: "adminEmail",
			type: "email",
			label: "Admin Email",
			required: true,
		},
		{
			// Stored only during pending_approval; cleared once Dokploy env vars are set.
			name: "adminPasswordTemp",
			type: "text",
			label: "Admin Password (temp)",
			admin: {
				hidden: true,
				description:
					"Temporary — cleared automatically after provisioning completes.",
			},
		},
		{
			name: "status",
			type: "select",
			label: "Status",
			defaultValue: "pending_approval",
			required: true,
			options: [
				{ label: "Pending Approval", value: "pending_approval" },
				{ label: "Approved", value: "approved" },
				{ label: "Rejected", value: "rejected" },
				{ label: "Provisioning", value: "provisioning" },
				{ label: "Ready", value: "ready" },
				{ label: "Stopped", value: "stopped" },
				{ label: "Failed", value: "failed" },
			],
		},
		{
			name: "progressStep",
			type: "number",
			label: "Provisioning Step",
			defaultValue: 0,
			admin: { description: "0–5 (0 = pending, 5 = deployed)" },
		},
		{
			name: "imageTag",
			type: "text",
			label: "Image Tag",
			defaultValue: "latest",
			admin: {
				description:
					"Docker image tag deployed (e.g. latest, 1.2.3). List available tags: GET /api/admin/versions",
			},
		},
		{
			name: "instanceUrl",
			type: "text",
			label: "Instance URL",
		},
		{
			name: "errorMessage",
			type: "textarea",
			label: "Error Message",
		},
		{
			name: "seedMode",
			type: "select",
			label: "Seed Mode",
			defaultValue: "empty",
			options: [
				{ label: "Empty", value: "empty" },
				{ label: "Demo data", value: "demo" },
				{ label: "Custom data", value: "custom" },
			],
			admin: { readOnly: true },
		},
		{
			name: "dokployProjectId",
			type: "text",
			label: "Dokploy Project ID",
			admin: { readOnly: true },
		},
		{
			name: "dokployAppId",
			type: "text",
			label: "Dokploy App ID",
			admin: { readOnly: true },
		},
		{
			name: "dokployPostgresId",
			type: "text",
			label: "Dokploy Postgres ID",
			admin: { readOnly: true },
		},
		{
			name: "seedToken",
			type: "text",
			label: "Seed Token",
			admin: {
				readOnly: true,
				description: "Bearer token for seed YAML endpoints",
			},
		},
		{
			name: "seedFoundationYaml",
			type: "textarea",
			label: "Seed — Foundation YAML",
			admin: { readOnly: true },
		},
		{
			name: "seedAcademicsYaml",
			type: "textarea",
			label: "Seed — Academics YAML",
			admin: { readOnly: true },
		},
		{
			name: "seedUsersYaml",
			type: "textarea",
			label: "Seed — Users YAML",
			admin: { readOnly: true },
		},
	],
	timestamps: true,
};
