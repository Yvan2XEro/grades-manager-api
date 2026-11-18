import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin, customSession, organization } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";
import { domainUsersRepo } from "@/modules/domain-users";
import { db } from "../db";
import * as schema from "../db/schema/auth";
import { adminRoles, superadminRoles } from "./auth-roles";
import {
	defaultEmailSend,
	sendResetPassword,
	sendStaffInvitation,
	sendWelcomeInstitution,
} from "./email";
import {
	organizationAccessControl,
	organizationRoles,
} from "./organization-roles";

export { adminRoles, superadminRoles };

/**
 * Maps userId → orgId for the duration of a sign-in request.
 * Replaces AsyncLocalStorage which does not reliably propagate across
 * Better-Auth's internal async boundaries in Bun.
 */
const pendingOrgByUser = new Map<string, string>();

const orgScopedLoginHook = createAuthMiddleware(async (ctx) => {
	if (ctx.path !== "/sign-in/email") return;
	const slug = ctx.request?.headers.get("X-Organization-Slug");
	if (!slug) return;

	const [org] = await db
		.select({ id: schema.organization.id })
		.from(schema.organization)
		.where(eq(schema.organization.slug, slug))
		.limit(1);
	if (!org) return;

	const email = (ctx.body as Record<string, unknown>)?.email;
	if (typeof email !== "string") return;

	const [foundUser] = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(eq(schema.user.email, email))
		.limit(1);
	// If user not found, let better-auth handle the "invalid credentials" error
	if (!foundUser) return;

	const [membership] = await db
		.select({ id: schema.member.id })
		.from(schema.member)
		.where(
			and(
				eq(schema.member.organizationId, org.id),
				eq(schema.member.userId, foundUser.id),
			),
		)
		.limit(1);
	if (!membership) {
		throw new APIError("FORBIDDEN", {
			message:
				"You are not a member of this organization. Contact your administrator.",
		});
	}

	pendingOrgByUser.set(foundUser.id, org.id);
});

type SessionWithActiveOrganization = {
	activeOrganizationId?: string | null;
};

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	plugins: [
		admin({ adminRoles }),
		customSession(async ({ session, user }) => {
			const sessionWithOrg = session as typeof session &
				SessionWithActiveOrganization;
			const domainProfiles = await domainUsersRepo.getDomainsByMemberships(
				user.id,
			);
			const activeMembership =
				sessionWithOrg.activeOrganizationId && user.id
					? await db.query.member.findFirst({
							where: and(
								eq(
									schema.member.organizationId,
									sessionWithOrg.activeOrganizationId,
								),
								eq(schema.member.userId, user.id),
							),
						})
					: null;
			return {
				user,
				session,
				domainProfiles: domainProfiles,
				activeMembership: activeMembership
					? {
							id: activeMembership.id,
							role: activeMembership.role,
							organizationId: activeMembership.organizationId,
						}
					: null,
			};
		}),
		organization({
			ac: organizationAccessControl,
			roles: organizationRoles,
			allowUserToCreateOrganization: true,
			sendInvitationEmail: async ({
				invitation,
				organization: org,
				inviter,
			}) => {
				const base =
					process.env.CORS_ORIGINS?.split(",")[0]?.trim() ??
					"http://localhost:5173";
				const url = `${base}/#/accept-invitation/${invitation.id}?email=${encodeURIComponent(invitation.email)}`;
				await sendStaffInvitation({
					to: invitation.email,
					name: invitation.email.split("@")[0],
					role: invitation.role,
					institution: org.name,
					invitedBy: inviter.user.name,
					url,
				}).catch((err) => console.error("[email] sendInvitationEmail", err));
			},
			organizationHooks: {
				afterCreateOrganization: async ({ organization: org, member }) => {
					await sendWelcomeInstitution({
						to: member.user.email,
						name: member.user.name,
						institution: org.name,
					}).catch((err) => console.error("[email] welcome institution", err));
				},
			},
		}),
	],
	trustedOrigins: process.env.CORS_ORIGINS?.split(",") || [],
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			// Better Auth places ?token= before the # for hash routers.
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
			}).catch((err) => console.error("[email] sendResetPassword", err));
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			await defaultEmailSend(
				user.email,
				"Verify your email",
				`<a href="${url}">Verify your email</a>`,
			).catch((err) => console.warn("[auth] verification email failed", err));
		},
	},
	user: {
		changeEmail: {
			enabled: true,
			sendChangeEmailVerification: async ({
				user,
				newEmail,
				url,
			}: {
				user: { email: string };
				newEmail: string;
				url: string;
			}) => {
				// Send to the CURRENT email so the account owner must confirm the change
				await defaultEmailSend(
					user.email,
					"Confirm your email change",
					`<p>A request was made to change your email to <strong>${newEmail}</strong>.</p><a href="${url}">Confirm this change</a><p>If you did not request this, ignore this email.</p>`,
				).catch((err) =>
					console.warn("[auth] change-email verification failed", err),
				);
			},
		},
	},
	hooks: {
		before: orgScopedLoginHook,
	},
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const orgId = pendingOrgByUser.get(session.userId);
					if (orgId) {
						pendingOrgByUser.delete(session.userId);
						return {
							data: {
								...session,
								activeOrganizationId: orgId,
							},
						};
					}
				},
			},
		},
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: (process.env.BETTER_AUTH_COOKIE_SAMESITE ?? "lax") as
				| "lax"
				| "strict"
				| "none"
				| "Lax"
				| "None"
				| "Strict",
			secure: process.env.BETTER_AUTH_COOKIE_SECURE === "true",
			httpOnly: true,
		},
	},
});
