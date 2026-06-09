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
	fields: [
		{
			name: "orgName",
			type: "text",
			label: "Nom de l'etablissement",
			required: true,
		},
		{
			name: "client",
			type: "relationship",
			relationTo: "users",
			admin: { readOnly: true },
		},
		{
			name: "subdomain",
			type: "text",
			label: "Sous-domaine",
			required: true,
		},
		{
			name: "institutionType",
			type: "select",
			label: "Type d'etablissement",
			options: [
				{ label: "Universite", value: "university" },
				{ label: "Grande Ecole", value: "school" },
				{ label: "Institut", value: "institute" },
				{ label: "Lycee / Secondaire", value: "secondary" },
				{ label: "Autre", value: "other" },
			],
		},
		{
			name: "country",
			type: "text",
			label: "Pays",
		},
		{
			name: "adminName",
			type: "text",
			label: "Nom de l'administrateur",
		},
		{
			name: "adminEmail",
			type: "email",
			label: "Email de l'administrateur",
			required: true,
		},
		{
			name: "status",
			type: "select",
			label: "Statut",
			defaultValue: "pending",
			required: true,
			options: [
				{ label: "En attente", value: "pending" },
				{ label: "En cours", value: "provisioning" },
				{ label: "Prete", value: "ready" },
				{ label: "Echouee", value: "failed" },
			],
		},
		{
			name: "progressStep",
			type: "number",
			label: "Etape de provisionnement",
			defaultValue: 0,
			admin: { description: "0-5 (0=pending, 5=deployed)" },
		},
		{
			name: "instanceUrl",
			type: "text",
			label: "URL de l'instance",
		},
		{
			name: "errorMessage",
			type: "textarea",
			label: "Erreur",
		},
		{
			name: "seedMode",
			type: "select",
			label: "Mode de seed",
			defaultValue: "empty",
			options: [
				{ label: "Instance vide", value: "empty" },
				{ label: "Données de démonstration", value: "demo" },
				{ label: "Données personnalisées", value: "custom" },
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
