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
				const id = String(doc.id);

				// Create "submitted" event on first creation
				if (operation === "create") {
					await req.payload
						.create({
							collection: "instance-events",
							data: {
								instance: id,
								eventType: "submitted",
								actorEmail: String(doc.adminEmail ?? ""),
							},
							req,
						})
						.catch(console.error);
					return;
				}

				if (operation !== "update") return;

				const prevStatus = previousDoc?.status;
				const newStatus = doc.status;

				// Admin approved → create event, send email, trigger provisioning
				if (newStatus === "approved" && prevStatus === "pending_approval") {
					await req.payload
						.create({
							collection: "instance-events",
							data: {
								instance: id,
								eventType: "approved",
								actorEmail: String(req.user?.email ?? "admin"),
							},
							req,
						})
						.catch(console.error);

					// Email the portal client
					const clientField = doc.client as
						| { id?: string; name?: string; email?: string }
						| string
						| null;
					const clientEmail =
						typeof clientField === "object" ? clientField?.email : null;
					const clientName =
						typeof clientField === "object" ? clientField?.name : null;
					if (clientEmail) {
						const { instanceApprovedEmailHTML } = await import(
							"@/lib/email-templates"
						);
						req.payload
							.sendEmail({
								to: clientEmail,
								subject: "TKAMS — Your instance is being set up",
								html: instanceApprovedEmailHTML({
									userName: clientName ?? clientEmail,
									orgName: String(doc.orgName ?? ""),
									subdomain: String(doc.subdomain ?? ""),
								}),
							})
							.catch(console.error);
					}

					// Auto-create a draft invoice for this instance
					const clientId =
						typeof doc.client === "object"
							? (doc.client as { id?: string })?.id
							: doc.client;
					if (clientId) {
						const year = new Date().getFullYear();
						req.payload
							.create({
								collection: "invoices",
								data: {
									invoiceNumber: `INV-${year}-${id.slice(0, 6).toUpperCase()}`,
									client: String(clientId),
									instance: id,
									amount: 0,
									currency: "FCFA",
									status: "unpaid",
									description: `TKAMS subscription — ${doc.orgName ?? id}`,
									period: `${year} – ${year + 1}`,
								},
								req,
							})
							.catch(console.error);
					}

					if (!doc.dokployProjectId) {
						const { deployToDokploy } = await import("@/lib/provision");
						deployToDokploy(id, req.payload).catch(console.error);
					}
				}

				// Admin rejected
				if (newStatus === "rejected" && prevStatus === "pending_approval") {
					await req.payload
						.create({
							collection: "instance-events",
							data: {
								instance: id,
								eventType: "rejected",
								actorEmail: String(req.user?.email ?? "admin"),
							},
							req,
						})
						.catch(console.error);

					const clientField = doc.client as
						| { id?: string; name?: string; email?: string }
						| string
						| null;
					const clientEmail =
						typeof clientField === "object" ? clientField?.email : null;
					const clientName =
						typeof clientField === "object" ? clientField?.name : null;
					if (clientEmail) {
						const { instanceRejectedEmailHTML } = await import(
							"@/lib/email-templates"
						);
						req.payload
							.sendEmail({
								to: clientEmail,
								subject: "TKAMS — Update on your instance request",
								html: instanceRejectedEmailHTML({
									userName: clientName ?? clientEmail,
									orgName: String(doc.orgName ?? ""),
								}),
							})
							.catch(console.error);
					}
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
