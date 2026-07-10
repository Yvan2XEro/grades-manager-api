import { TRPCError } from "@trpc/server";
import type { Context } from "@/lib/context";
import { notFound } from "@/modules/_shared/errors";
import { roleSatisfies } from "@/modules/authz";
import * as repo from "./profiles.repo";

function assertAccess(ctx: Context, profileId: string) {
	const isSelf = ctx.profile?.id === profileId;
	const isAdmin = roleSatisfies(ctx.memberRole, ["administrator"]);
	if (!isSelf && !isAdmin) {
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
