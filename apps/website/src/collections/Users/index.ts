import type { CollectionConfig } from "payload";
import {
	forgotPasswordEmailHTML,
	verificationEmailHTML,
} from "@/lib/email-templates";
import {
	authenticated,
	authenticatedAndIsAdmin,
} from "../../access/authenticated";

export const Users: CollectionConfig = {
	slug: "users",
	access: {
		admin: authenticatedAndIsAdmin,
		create: () => true,
		delete: authenticated,
		read: authenticated,
		update: authenticated,
	},
	admin: {
		defaultColumns: ["name", "email", "role"],
		useAsTitle: "name",
	},
	auth: {
		verify: {
			generateEmailSubject: () => "TKAMS — Vérifiez votre adresse email",
			generateEmailHTML: ({ token, user }) =>
				verificationEmailHTML({
					token: String(token),
					userName: String((user as { name?: string }).name ?? ""),
				}),
		},
		forgotPassword: {
			generateEmailSubject: () =>
				"TKAMS — Réinitialisation de votre mot de passe",
			generateEmailHTML: (args) =>
				forgotPasswordEmailHTML({
					token: String(args?.token ?? ""),
					userName: String(
						(args?.user as { name?: string } | undefined)?.name ?? "",
					),
				}),
		},
	},
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
