import { initTRPC, TRPCError } from "@trpc/server";
import { ADMIN_ROLES, assertRole, SUPER_ADMIN_ROLES } from "../modules/authz";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	assertRole(ctx.profile, ADMIN_ROLES);
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const superAdminProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	assertRole(ctx.profile, SUPER_ADMIN_ROLES);
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const gradingProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (!ctx.permissions?.canGrade) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Insufficient permissions to perform grading actions",
		});
	}
	return next();
});

const tenantMiddleware = t.middleware(({ ctx, next }) => {
	if (!ctx.institution) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Institution context is missing",
		});
	}
	return next({
		ctx: {
			...ctx,
			institution: ctx.institution,
		},
	});
});

export const tenantProcedure = publicProcedure.use(tenantMiddleware);
export const tenantProtectedProcedure =
	protectedProcedure.use(tenantMiddleware);
export const tenantAdminProcedure = adminProcedure.use(tenantMiddleware);
export const tenantSuperAdminProcedure =
	superAdminProcedure.use(tenantMiddleware);
export const tenantGradingProcedure = gradingProcedure.use(tenantMiddleware);
