import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, customSession } from "better-auth/plugins";
import { domainUsersRepo } from "@/modules/domain-users";
import { db } from "../db";
import * as schema from "../db/schema/auth";

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
			);
			return {
				user,
				session,
				domainProfiles: domainProfiles as typeof domainProfiles,
			};
		}),
	],
	trustedOrigins: [process.env.CORS_ORIGIN || ""],
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
