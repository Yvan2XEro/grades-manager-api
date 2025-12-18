import {
	adminClient,
	customSessionClient,
	organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "../../../server/src/lib/auth";
import {
	organizationAccessControl,
	organizationRoles,
} from "../../../server/src/lib/organization-roles";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_SERVER_URL,
	plugins: [
		adminClient(),
		customSessionClient<typeof auth>(),
		organizationClient({
			ac: organizationAccessControl,
			roles: organizationRoles,
		}),
	],
});
