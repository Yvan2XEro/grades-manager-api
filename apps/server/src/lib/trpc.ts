import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { ADMIN_ROLES, SUPER_ADMIN_ROLES, assertRole } from "../modules/authz";

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
