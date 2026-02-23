import { AsyncLocalStorage } from "node:async_hooks";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, customSession, organization } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";
import { Resend } from "resend";
import { domainUsersRepo } from "@/modules/domain-users";
import { db } from "../db";
import * as schema from "../db/schema/auth";
import {
	organizationAccessControl,
	organizationRoles,
} from "./organization-roles";

/**
 * Request-scoped storage to pass the resolved organizationId
 * from hooks.before to databaseHooks.session.create.before.
 */
const orgContext = new AsyncLocalStorage<{ orgId: string }>();

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

	orgContext.enterWith({ orgId: org.id });
});

const resend = process.env.RESEND_API_KEY
	? new Resend(process.env.RESEND_API_KEY)
	: null;
const emailFrom = process.env.EMAIL_FROM ?? "noreply@example.com";

export const superadminRoles = ["admin"];
export const adminRoles = ["admin", ...superadminRoles];
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	plugins: [
		admin({ adminRoles }),
		customSession(async ({ session, user }) => {
			const domainProfiles = await domainUsersRepo.getDomainsByAuthUserId(
				user.id,
				{
					authUserId: user.id,
					primaryEmail: user.email,
					firstName: user.name,
					lastName: "",
				},
			);
			const activeMembership =
				session.activeOrganizationId && user.id
					? await db.query.member.findFirst({
							where: and(
								eq(schema.member.organizationId, session.activeOrganizationId),
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
		}),
	],
	trustedOrigins: process.env.CORS_ORIGINS?.split(",") || [],
	emailAndPassword: {
		enabled: true,
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			if (!resend) {
				console.warn(
					"[auth] RESEND_API_KEY not set – skipping verification email",
				);
				return;
			}
			void resend.emails.send({
				from: emailFrom,
				to: user.email,
				subject: "Verify your email",
				html: `<a href="${url}">Verify your email</a>`,
			});
		},
	},
	user: {
		changeEmail: {
			enabled: true,
			sendChangeEmailVerification: async ({ user, newEmail, url }) => {
				console.log(url);
				if (!resend) {
					console.warn(
						"[auth] RESEND_API_KEY not set – skipping change-email verification",
					);
					return;
				}
				// Send to the CURRENT email so the account owner must confirm the change
				void resend.emails.send({
					from: emailFrom,
					to: user.email,
					subject: "Confirm your email change",
					html: `<p>A request was made to change your email to <strong>${newEmail}</strong>.</p><a href="${url}">Confirm this change</a><p>If you did not request this, ignore this email.</p>`,
				});
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
					const store = orgContext.getStore();
					if (store?.orgId) {
						return {
							data: {
								...session,
								activeOrganizationId: store.orgId,
							},
						};
					}
				},
			},
		},
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: process.env.BETTER_AUTH_COOKIE_SAMESITE ?? "lax",
			secure: process.env.BETTER_AUTH_COOKIE_SECURE === "true",
			httpOnly: true,
		},
	},
});
