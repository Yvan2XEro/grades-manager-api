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
	return db
		.select({
			id: schema.gradeAccessGrants.id,
			createdAt: schema.gradeAccessGrants.createdAt,
			profile: {
				id: schema.domainUsers.id,
				firstName: schema.domainUsers.firstName,
				lastName: schema.domainUsers.lastName,
				primaryEmail: schema.domainUsers.primaryEmail,
				role: memberAlias.role,
			},
			grantedBy: {
				id: grantedByAlias.id,
				firstName: grantedByAlias.firstName,
				lastName: grantedByAlias.lastName,
			},
		})
		.from(schema.gradeAccessGrants)
		.innerJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.gradeAccessGrants.profileId),
		)
		.leftJoin(
			memberAlias,
			eq(memberAlias.id, schema.domainUsers.memberId),
		)
		.leftJoin(
			grantedByAlias,
			eq(grantedByAlias.id, schema.gradeAccessGrants.grantedByProfileId),
		)
		.where(eq(schema.gradeAccessGrants.institutionId, institutionId))
		.orderBy(schema.gradeAccessGrants.createdAt);
}
