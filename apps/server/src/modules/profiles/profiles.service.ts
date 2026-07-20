import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import type { Context } from "@/lib/context";
import { conflict, notFound } from "@/modules/_shared/errors";
import { roleSatisfies } from "@/modules/authz";
import * as usersService from "@/modules/users/users.service";
import * as repo from "./profiles.repo";

function assertAccess(ctx: Context, profileId: string) {
	const isSelf = ctx.profile?.id === profileId;
	const isAdmin = roleSatisfies(ctx.memberRole, ["administrator"]);
	if (!isSelf && !isAdmin) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
}

function assertAdmin(ctx: Context) {
	if (!roleSatisfies(ctx.memberRole, ["administrator"])) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
}

export async function getProfile(profileId: string, ctx: Context) {
	assertAccess(ctx, profileId);
	const profile = await repo.getProfile(profileId);
	if (!profile) throw notFound("Profile not found");
	const student = await repo.getStudentByDomainUserId(
		profileId,
		ctx.institution.id,
	);
	const availableTabs: string[] = ["identity"];
	if (student) {
		availableTabs.push("enrollments", "results", "finances", "guardians");
	}
	if (roleSatisfies(ctx.memberRole, ["administrator"])) {
		availableTabs.push("access");
	}
	return { ...profile, student, availableTabs };
}

export async function getEnrollments(profileId: string, ctx: Context) {
	assertAccess(ctx, profileId);
	const student = await repo.getStudentByDomainUserId(
		profileId,
		ctx.institution.id,
	);
	if (!student) return [];
	return repo.listEnrollments(student.id, ctx.institution.id);
}

export async function getResults(
	profileId: string,
	ctx: Context,
	academicYearId?: string,
) {
	assertAccess(ctx, profileId);
	const student = await repo.getStudentByDomainUserId(
		profileId,
		ctx.institution.id,
	);
	if (!student) return [];
	return repo.listCourseResults(student.id, ctx.institution.id, academicYearId);
}

export async function getFinances(profileId: string, ctx: Context) {
	assertAccess(ctx, profileId);
	const student = await repo.getStudentByDomainUserId(
		profileId,
		ctx.institution.id,
	);
	if (!student) return [];
	return repo.listFeeAssignments(student.id, ctx.institution.id);
}

export async function getGuardians(profileId: string, ctx: Context) {
	assertAccess(ctx, profileId);
	const student = await repo.getStudentByDomainUserId(
		profileId,
		ctx.institution.id,
	);
	if (!student) return [];
	return repo.listGuardians(student.id, ctx.institution.id);
}

// ── Auth account management (admin only) ─────────────────────────────────────

export async function getAuthAccount(profileId: string, ctx: Context) {
	assertAdmin(ctx);
	const profile = await repo.getProfile(profileId);
	if (!profile?.memberId) return null;

	const [row] = await db
		.select({
			authUserId: authSchema.user.id,
			email: authSchema.user.email,
			emailVerified: authSchema.user.emailVerified,
			banned: authSchema.user.banned,
			banReason: authSchema.user.banReason,
			memberRole: authSchema.member.role,
			memberSince: authSchema.member.createdAt,
		})
		.from(authSchema.member)
		.innerJoin(
			authSchema.user,
			eq(authSchema.user.id, authSchema.member.userId),
		)
		.where(eq(authSchema.member.id, profile.memberId))
		.limit(1);

	return row ?? null;
}

export async function createAuthForProfile(
	profileId: string,
	data: { email: string; password: string; memberRole: string },
	ctx: Context,
) {
	assertAdmin(ctx);
	try {
		return await usersService.createAuthForProfile(profileId, data, {
			organizationId: ctx.organizationId!,
			institutionId: ctx.institution.id,
		});
	} catch (err) {
		if (err instanceof usersService.UserAlreadyExistsError) {
			throw conflict(err.message);
		}
		throw err;
	}
}

export async function linkAuthAccount(
	profileId: string,
	authEmail: string,
	ctx: Context,
) {
	assertAdmin(ctx);
	return usersService.linkAuthAccount(
		profileId,
		authEmail,
		ctx.organizationId!,
	);
}

export async function sendPasswordReset(profileId: string, ctx: Context) {
	assertAdmin(ctx);
	const authAccount = await getAuthAccount(profileId, ctx);
	if (!authAccount) throw notFound("No auth account linked to this profile");

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await (auth.api as any).forgetPassword({
		body: { email: authAccount.email, redirectTo: "/reset-password" },
	});
}

export async function setBanStatus(
	profileId: string,
	banned: boolean,
	ctx: Context,
) {
	assertAdmin(ctx);
	const authAccount = await getAuthAccount(profileId, ctx);
	if (!authAccount) throw notFound("No auth account linked to this profile");

	if (banned) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (auth.api as any).banUser({
			body: { userId: authAccount.authUserId },
		});
	} else {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (auth.api as any).unbanUser({
			body: { userId: authAccount.authUserId },
		});
	}
}
