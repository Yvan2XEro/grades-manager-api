import { initTRPC, TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({ ctx: { ...ctx, session: ctx.session } });
});

const withInstitution = protectedProcedure.use(({ ctx, next }) => {
	if (!ctx.institution) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "No active institution",
		});
	}
	return next({ ctx: { ...ctx, institution: ctx.institution } });
});

async function getMemberRole(ctx: {
	db: Context["db"];
	session: NonNullable<Context["session"]>;
	institution: NonNullable<Context["institution"]>;
}): Promise<string | null> {
	const result = await ctx.db.execute(
		sql`SELECT role FROM member WHERE user_id = ${ctx.session.user.id} AND organization_id = ${ctx.institution.id} LIMIT 1`,
	);
	return (result.rows[0] as { role: string } | undefined)?.role ?? null;
}

export const tenantProcedure = withInstitution;

export const adminProcedure = withInstitution.use(async ({ ctx, next }) => {
	const role = await getMemberRole(ctx);
	if (role !== "admin") {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next({ ctx });
});

export const teacherProcedure = withInstitution.use(async ({ ctx, next }) => {
	const role = await getMemberRole(ctx);
	if (!role || !["teacher", "admin"].includes(role)) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next({ ctx });
});

export const principalProcedure = withInstitution.use(async ({ ctx, next }) => {
	const role = await getMemberRole(ctx);
	if (!role || !["principal", "admin"].includes(role)) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next({ ctx });
});
