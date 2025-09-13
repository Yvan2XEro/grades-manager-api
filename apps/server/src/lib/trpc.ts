import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { adminRoles, superadminRoles } from "./auth";

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
	if (!ctx.session.user.role || !adminRoles.includes(ctx.session.user.role)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "User is not allowed to perform this action",
			cause: "Not admin",
		});
	}
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
	if (
		!ctx.session.user.role ||
		!superadminRoles.includes(ctx.session.user.role)
	) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "User is not allowed to perform this action",
			cause: "Not super admin",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});
