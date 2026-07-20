import type { AccessArgs } from "payload";

import type { User } from "@/payload-types";

type isAuthenticated = (args: AccessArgs<User>) => boolean;

export const authenticated: isAuthenticated = ({ req: { user } }) => {
	return Boolean(user);
};

export const authenticatedAndIsAdmin: isAuthenticated = ({ req: { user } }) => {
	return Boolean(user) && user?.role === "super_admin";
};
