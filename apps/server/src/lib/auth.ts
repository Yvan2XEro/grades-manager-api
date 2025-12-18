import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, customSession, organization } from "better-auth/plugins";
import { domainUsersRepo } from "@/modules/domain-users";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema/auth";
import {
	organizationAccessControl,
	organizationRoles,
} from "./organization-roles";

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
					businessRole: "student",
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
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
});
