import type { CollectionConfig } from "payload";
import { authenticated } from "../../access/authenticated";

export const Users: CollectionConfig = {
	slug: "users",
	access: {
		admin: authenticated,
		create: () => true,
		delete: authenticated,
		read: authenticated,
		update: authenticated,
	},
	admin: {
		defaultColumns: ["name", "email", "role"],
		useAsTitle: "name",
	},
	auth: true,
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
		{
			name: "role",
			type: "select",
			defaultValue: "client",
			required: true,
			options: [
				{ label: "Client", value: "client" },
				{ label: "Super Admin", value: "super_admin" },
			],
			access: {
				update: ({ req: { user } }) => Boolean(user),
			},
		},
	],
	timestamps: true,
};
