import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
	admin as adminPlugin,
	organization,
	twoFactor,
} from "better-auth/plugins";
import { and, eq, isNull } from "drizzle-orm";
import * as authSchema from "../db/auth";
import { db } from "../db/index";
import { staff } from "../db/schema";
import { sendResetPassword } from "./email";
import { ac, admin, principal, teacher } from "./permissions";

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
	secret: process.env.BETTER_AUTH_SECRET!,
	baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			await sendResetPassword({ to: user.email, name: user.name, url });
		},
	},
	plugins: [
		organization({
			ac,
			roles: { admin, principal, teacher },
			allowUserToCreateOrganization: true,
			organizationHooks: {
				afterAcceptInvitation: async (data) => {
					await db
						.update(staff)
						.set({ authUserId: data.member.userId, updatedAt: new Date() })
						.where(
							and(eq(staff.email, data.user.email), isNull(staff.authUserId)),
						);
				},
			},
		}),
		twoFactor(),
		adminPlugin({
			defaultRole: "user",
			adminRoles: ["admin"],
		}),
	],
	trustedOrigins: [process.env.CORS_ORIGINS ?? "http://localhost:5173"],
});

export type Session = typeof auth.$Infer.Session;
export type ActiveOrganization = typeof auth.$Infer.ActiveOrganization;
