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
import {
	sendResetPassword,
	sendStaffInvitation,
	sendWelcomeInstitution,
} from "./email";
import { ac, admin, principal, teacher } from "./permissions";

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
	secret: process.env.BETTER_AUTH_SECRET!,
	baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			// Better Auth places ?token= before the # when using URL.searchParams,
			// resulting in /?token=xxx#/reset-password where getToken() misses it.
			// Rebuild as /#/reset-password?token=xxx (hash-router compatible).
			const token = new URL(url).searchParams.get("token");
			const base =
				process.env.CORS_ORIGINS?.split(",")[0]?.trim() ??
				"http://localhost:5173";
			const frontendUrl = `${base}/#/reset-password?token=${token}`;
			await sendResetPassword({
				to: user.email,
				name: user.name,
				url: frontendUrl,
			});
		},
	},
	plugins: [
		organization({
			ac,
			roles: { admin, principal, teacher },
			allowUserToCreateOrganization: true,
			sendInvitationEmail: async ({ invitation, organization, inviter }) => {
				const base =
					process.env.CORS_ORIGINS?.split(",")[0]?.trim() ??
					"http://localhost:5173";
				const url = `${base}/#/accept-invitation/${invitation.id}?email=${encodeURIComponent(invitation.email)}`;
				await sendStaffInvitation({
					to: invitation.email,
					name: invitation.email.split("@")[0],
					role: invitation.role,
					institution: organization.name,
					invitedBy: inviter.user.name,
					url,
				}).catch((err) => console.error("[email] sendInvitationEmail", err));
			},
			organizationHooks: {
				afterCreate: async ({
					organization,
					member,
				}: {
					organization: { name: string };
					member: { user: { email: string; name: string } };
				}) => {
					await sendWelcomeInstitution({
						to: member.user.email,
						name: member.user.name,
						institution: organization.name,
					}).catch((err) => console.error("[email] welcome institution", err));
				},
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
