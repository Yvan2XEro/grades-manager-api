import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: "/api/auth",
	plugins: [organizationClient()],
});

export const { useSession, signIn, signOut } = authClient;
