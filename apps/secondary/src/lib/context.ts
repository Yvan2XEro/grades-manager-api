import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { institutions } from "../db/schema";
import { auth } from "./auth";

export async function createContext(opts: FetchCreateContextFnOptions) {
	const session = await auth.api.getSession({ headers: opts.req.headers });

	let institution = null;
	if (session?.session.activeOrganizationId) {
		const rows = await db
			.select()
			.from(institutions)
			.where(eq(institutions.id, session.session.activeOrganizationId))
			.limit(1);
		institution = rows[0] ?? null;
	}

	return { session, institution, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
