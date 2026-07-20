import type { GlobalConfig } from "payload";

export const DeploySettings: GlobalConfig = {
	slug: "deploy-settings",
	label: "Deploy Settings",
	admin: {
		group: "Instances",
		description:
			"Controls which image version is used when provisioning new instances.",
	},
	access: {
		read: ({ req }) => !!req.user,
		update: ({ req }) => req.user?.role === "super_admin",
	},
	fields: [
		{
			name: "defaultImageTag",
			type: "text",
			label: "Default Image Tag",
			defaultValue: "latest",
			admin: {
				components: {
					Field: "@/globals/DeploySettings/ImageTagSelect#ImageTagSelect",
				},
			},
		},
	],
};
