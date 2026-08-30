import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor } from "better-auth/plugins";
import * as authSchema from "../db/auth";
import { db } from "../db/index";
import { ac, admin, principal, teacher } from "./permissions";

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
	secret: process.env.BETTER_AUTH_SECRET!,
	baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
	emailAndPassword: { enabled: true },
	plugins: [
		organization({
			ac,
			roles: { admin, principal, teacher },
			allowUserToCreateOrganization: false,
		}),
		twoFactor(),
	],
	trustedOrigins: [process.env.CORS_ORIGINS ?? "http://localhost:5173"],
});

export type Session = typeof auth.$Infer.Session;
export type ActiveOrganization = typeof auth.$Infer.ActiveOrganization;
