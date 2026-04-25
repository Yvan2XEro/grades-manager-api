import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import { notFound } from "@/modules/_shared/errors";
import * as repo from "./grade-access-grants.repo";

async function requireProfileInInstitution(
	profileId: string,
	institutionId: string,
) {
	const row = await db
		.select({
			id: schema.domainUsers.id,
			memberOrg: authSchema.member.organizationId,
		})
		.from(schema.domainUsers)
		.leftJoin(
			authSchema.member,
			eq(authSchema.member.id, schema.domainUsers.memberId),
		)
		.where(eq(schema.domainUsers.id, profileId))
		.limit(1)
		.then((rows) => rows[0]);

	if (!row)
		throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

	const institution = await db
		.select({ organizationId: schema.institutions.organizationId })
		.from(schema.institutions)
		.where(eq(schema.institutions.id, institutionId))
		.limit(1)
		.then((rows) => rows[0]);
	if (!institution)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Institution not found",
		});

	if (row.memberOrg && row.memberOrg !== institution.organizationId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "User does not belong to this institution",
		});
	}
	return row.id;
}

export async function grantAccess(opts: {
	profileId: string;
	institutionId: string;
	grantedByProfileId: string | null;
}) {
	await requireProfileInInstitution(opts.profileId, opts.institutionId);
	try {
		return await repo.create({
			profileId: opts.profileId,
			institutionId: opts.institutionId,
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
