import { initTRPC, TRPCError } from "@trpc/server";
import {
	ADMIN_ROLES,
	ADMINISTRATOR_ROLES,
	assertRole,
	STAFF_ROLES,
	SUPER_ADMIN_ROLES,
} from "../modules/authz";
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
	assertRole(ctx.memberRole, ADMIN_ROLES);
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
	assertRole(ctx.memberRole, SUPER_ADMIN_ROLES);
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

/** Any institution employee — refuses students and guests. */
export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
	assertRole(ctx.memberRole, STAFF_ROLES);
	return next();
});

/** Administrator and above — refuses deans (institution identity, accounts). */
export const administratorProcedure = protectedProcedure.use(
	({ ctx, next }) => {
		assertRole(ctx.memberRole, ADMINISTRATOR_ROLES);
		return next();
	},
);

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
export const tenantStaffProcedure = staffProcedure.use(tenantMiddleware);
export const tenantAdminProcedure = adminProcedure.use(tenantMiddleware);
export const tenantAdministratorProcedure =
	administratorProcedure.use(tenantMiddleware);
export const tenantSuperAdminProcedure =
	superAdminProcedure.use(tenantMiddleware);
export const tenantGradingProcedure = gradingProcedure.use(tenantMiddleware);

// ── Fee-clearance procedures (fine-grained, future-proof) ───────────────

export const feeConfigProcedure = tenantProtectedProcedure.use(
	({ ctx, next }) => {
		if (!ctx.permissions?.canConfigureFeeStructures) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Insufficient permissions to configure fee structures",
			});
		}
		return next();
	},
);

export const feeManageProcedure = tenantProtectedProcedure.use(
	({ ctx, next }) => {
		if (!ctx.permissions?.canManageFees) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Insufficient permissions to manage student fees",
			});
		}
		return next();
	},
);

export const feePaymentProcedure = tenantProtectedProcedure.use(
	({ ctx, next }) => {
		if (!ctx.permissions?.canRecordPayments) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Insufficient permissions to record payments",
			});
		}
		return next();
	},
);
