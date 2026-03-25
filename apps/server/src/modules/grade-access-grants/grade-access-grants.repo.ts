import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";

const grantedByAlias = alias(schema.domainUsers, "granted_by_user");

export async function create(data: schema.NewGradeAccessGrant) {
	const [item] = await db
		.insert(schema.gradeAccessGrants)
		.values(data)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	const [deleted] = await db
		.delete(schema.gradeAccessGrants)
		.where(
			and(
				eq(schema.gradeAccessGrants.id, id),
				eq(schema.gradeAccessGrants.institutionId, institutionId),
			),
		)
		.returning();
	return deleted;
}

export async function findByProfileAndInstitution(
	profileId: string,
	institutionId: string,
) {
	const rows = await db
		.select({ id: schema.gradeAccessGrants.id })
		.from(schema.gradeAccessGrants)
		.where(
			and(
				eq(schema.gradeAccessGrants.profileId, profileId),
				eq(schema.gradeAccessGrants.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

const memberAlias = alias(authSchema.member, "profile_member");

export async function list(institutionId: string) {
	const rows = await db
		.select({
			id: schema.gradeAccessGrants.id,
			createdAt: schema.gradeAccessGrants.createdAt,
			profileId: schema.domainUsers.id,
			profileFirstName: schema.domainUsers.firstName,
			profileLastName: schema.domainUsers.lastName,
			profileEmail: schema.domainUsers.primaryEmail,
			profileRole: memberAlias.role,
			grantedById: grantedByAlias.id,
			grantedByFirstName: grantedByAlias.firstName,
			grantedByLastName: grantedByAlias.lastName,
		})
		.from(schema.gradeAccessGrants)
		.innerJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.gradeAccessGrants.profileId),
		)
		.leftJoin(memberAlias, eq(memberAlias.id, schema.domainUsers.memberId))
		.leftJoin(
			grantedByAlias,
			eq(grantedByAlias.id, schema.gradeAccessGrants.grantedByProfileId),
		)
		.where(eq(schema.gradeAccessGrants.institutionId, institutionId))
		.orderBy(schema.gradeAccessGrants.createdAt);

	return rows.map((r) => ({
		id: r.id,
		createdAt: r.createdAt,
		profile: {
			id: r.profileId,
			firstName: r.profileFirstName,
			lastName: r.profileLastName,
			primaryEmail: r.profileEmail,
			role: r.profileRole,
		},
		grantedBy: r.grantedById
			? {
					firstName: r.grantedByFirstName,
					lastName: r.grantedByLastName,
				}
			: null,
	}));
}
