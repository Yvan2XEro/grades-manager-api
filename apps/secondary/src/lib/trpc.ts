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
	// Use orgId (Better-Auth nanoid) not institution UUID for the member lookup
	const result = await ctx.db.execute(
		sql`SELECT role FROM member WHERE user_id = ${ctx.session.user.id} AND organization_id = ${ctx.institution.orgId} LIMIT 1`,
	);
	return (result.rows[0] as { role: string } | undefined)?.role ?? null;
}

// "owner" is the role Better-Auth assigns to organization creators
const ADMIN_ROLES = ["admin", "owner"];

export const tenantProcedure = withInstitution;

export const adminProcedure = withInstitution.use(async ({ ctx, next }) => {
	const role = await getMemberRole(ctx);
	if (!role || !ADMIN_ROLES.includes(role)) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next({ ctx });
});

export const teacherProcedure = withInstitution.use(async ({ ctx, next }) => {
	const role = await getMemberRole(ctx);
	if (!role || !["teacher", ...ADMIN_ROLES].includes(role)) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next({ ctx: { ...ctx, callerRole: role } });
});

export const principalProcedure = withInstitution.use(async ({ ctx, next }) => {
	const role = await getMemberRole(ctx);
	if (!role || !["principal", ...ADMIN_ROLES].includes(role)) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next({ ctx });
});

// Platform-level super admin (Better-Auth admin plugin role = "admin")
export const systemAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
	const role = (ctx.session as { user: { role?: string } }).user.role;
	if (role !== "admin") {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next({ ctx });
});
