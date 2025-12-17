import {
	adminClient,
	customSessionClient,
	organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "../../../server/src/lib/auth";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_SERVER_URL,
	plugins: [
		adminClient(),
		customSessionClient<typeof auth>(),
		organizationClient(),
	],
});
