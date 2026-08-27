import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "../db/index";
import { ac, admin, principal, teacher } from "./permissions";

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg" }),
	secret: process.env.BETTER_AUTH_SECRET!,
	baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
	emailAndPassword: { enabled: true },
	plugins: [
		organization({
			ac,
			roles: { admin, principal, teacher },
			allowUserToCreateOrganization: false,
		}),
	],
	trustedOrigins: [process.env.CORS_ORIGINS ?? "http://localhost:5173"],
});

export type Session = typeof auth.$Infer.Session;
export type ActiveOrganization = typeof auth.$Infer.ActiveOrganization;
