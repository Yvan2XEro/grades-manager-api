import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import { notFound } from "@/modules/_shared/errors";
import {
	type InstitutionScope,
	requireProfileInInstitution,
} from "@/modules/_shared/tenant-ownership";
import { assertGradeDelegationCandidate } from "@/modules/authz/record-access";
import * as repo from "./grade-access-grants.repo";

export async function grantAccess(opts: {
	profileId: string;
	institution: InstitutionScope;
	grantedByProfileId: string | null;
}) {
	// A profile of another institution is NOT_FOUND, like an unknown one.
	await requireProfileInInstitution(opts.profileId, opts.institution);
	// Institution-wide grade access is for staff, never a student.
	const [member] = await db
		.select({ role: authSchema.member.role })
		.from(schema.domainUsers)
		.leftJoin(
			authSchema.member,
			eq(authSchema.member.id, schema.domainUsers.memberId),
		)
		.where(eq(schema.domainUsers.id, opts.profileId))
		.limit(1);
	await assertGradeDelegationCandidate(opts.profileId, member?.role);
	try {
		return await repo.create({
			profileId: opts.profileId,
			institutionId: opts.institution.id,
			grantedByProfileId: opts.grantedByProfileId,
		});
	} catch {
		throw new TRPCError({
			code: "CONFLICT",
			message: "This user already has institution-wide grade access",
		});
	}
}

export async function revokeAccess(opts: {
	id: string;
	institutionId: string;
}) {
	const deleted = await repo.remove(opts.id, opts.institutionId);
	if (!deleted) throw notFound("Grant not found");
	return deleted;
}

export async function listGrants(institutionId: string) {
	return repo.list(institutionId);
}
