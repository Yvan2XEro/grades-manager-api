import { sql } from "drizzle-orm";
import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./institutions.service";
import { updateSchema } from "./institutions.zod";

const ADMIN_ROLES = ["admin", "owner"];

export const router = trpcRouter({
	get: tenantProcedure.query(({ ctx }) => ctx.institution),

	myRole: tenantProcedure.query(async ({ ctx }) => {
		const result = await ctx.db.execute(
			sql`SELECT role FROM member WHERE user_id = ${ctx.session.user.id} AND organization_id = ${ctx.institution.orgId} LIMIT 1`,
		);
		const role = (result.rows[0] as { role: string } | undefined)?.role ?? null;
		return {
			role,
			isAdmin: !!role && ADMIN_ROLES.includes(role),
		};
	}),

	update: adminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) => service.update(ctx.institution.id, input)),
});
