import { and, eq, gt, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

const studentProjection = {
	id: schema.students.id,
	institutionId: schema.students.institutionId,
	domainUserId: schema.students.domainUserId,
	registrationNumber: schema.students.registrationNumber,
	class: schema.students.class,
	createdAt: schema.students.createdAt,
	profile: {
		id: schema.domainUsers.id,
		authUserId: schema.domainUsers.authUserId,
		businessRole: schema.domainUsers.businessRole,
		firstName: schema.domainUsers.firstName,
		lastName: schema.domainUsers.lastName,
		primaryEmail: schema.domainUsers.primaryEmail,
		phone: schema.domainUsers.phone,
		dateOfBirth: schema.domainUsers.dateOfBirth,
		placeOfBirth: schema.domainUsers.placeOfBirth,
		gender: schema.domainUsers.gender,
		nationality: schema.domainUsers.nationality,
		status: schema.domainUsers.status,
	},
};

const baseQuery = () =>
	db
		.select(studentProjection)
		.from(schema.students)
		.innerJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.students.domainUserId),
		);

const scopedWhere = (institutionId: string, condition?: SQL<unknown>) =>
	condition
		? and(eq(schema.students.institutionId, institutionId), condition)
		: eq(schema.students.institutionId, institutionId);

export type StudentWithProfile = Awaited<ReturnType<typeof internalFindById>>;

export async function create(data: schema.NewStudent) {
	const [created] = await db.insert(schema.students).values(data).returning();
	return internalFindById(created.id);
}

export async function update(
	id: string,
	data: Partial<schema.NewStudent>,
	institutionId: string,
) {
	const [updated] = await db
		.update(schema.students)
		.set(data)
		.where(
			and(
				eq(schema.students.id, id),
				eq(schema.students.institutionId, institutionId),
			),
		)
		.returning();
	if (!updated) return null;
	return internalFindById(updated.id);
}

async function internalFindById(id: string) {
	const [item] = await baseQuery().where(eq(schema.students.id, id)).limit(1);
	return item ?? null;
}

export async function findById(id: string, institutionId: string) {
	const [item] = await baseQuery()
		.where(
			and(
				eq(schema.students.id, id),
				eq(schema.students.institutionId, institutionId),
			),
		)
		.limit(1);
	return item ?? null;
}

export async function list(opts: {
	institutionId: string;
	classId?: string;
	q?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	const extraConditions: SQL<unknown>[] = [];
	if (opts.classId) {
		extraConditions.push(eq(schema.students.class, opts.classId));
	}
	if (opts.q) {
		const likeValue = `%${opts.q}%`;
		const qCond = or(
			ilike(schema.domainUsers.firstName, likeValue),
			ilike(schema.domainUsers.lastName, likeValue),
			ilike(schema.domainUsers.primaryEmail, likeValue),
			ilike(schema.students.registrationNumber, likeValue),
		);
		extraConditions.push(qCond);
	}
	if (opts.cursor) {
		extraConditions.push(gt(schema.students.id, opts.cursor));
	}

	const where = scopedWhere(
		opts.institutionId,
		extraConditions.length
			? extraConditions.length === 1
				? extraConditions[0]
				: and(...extraConditions)
			: undefined,
	);

	const items = await baseQuery()
		.where(where)
		.orderBy(schema.students.id)
		.limit(limit);
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function findByRegistrationNumber(
	registrationNumber: string,
	institutionId: string,
) {
	const [item] = await baseQuery()
		.where(
			and(
				eq(schema.students.registrationNumber, registrationNumber),
				eq(schema.students.institutionId, institutionId),
			),
		)
		.limit(1);
	return item ?? null;
}
