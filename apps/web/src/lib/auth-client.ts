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
import { getServerUrl } from "./runtime-config";

export const authClient = createAuthClient({
	baseURL: getServerUrl(),
	plugins: [
		adminClient(),
		customSessionClient<typeof auth>(),
		organizationClient({
			ac: organizationAccessControl,
			roles: organizationRoles,
		}),
	],
});
