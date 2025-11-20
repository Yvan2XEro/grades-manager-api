import type { Context as HonoContext } from "hono";
import { buildPermissions } from "../modules/authz";
import { domainUsersRepo } from "../modules/domain-users";
import { auth } from "./auth";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	let profile = null;
	if (session?.user?.id) {
		profile = await domainUsersRepo.findByAuthUserId(session.user.id);
	}
	return {
		session,
		profile,
		permissions: buildPermissions(profile),
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
