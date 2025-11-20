import { and, eq, gt, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

const studentProjection = {
	id: schema.students.id,
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

export type StudentWithProfile = Awaited<ReturnType<typeof findById>>;

export async function create(data: schema.NewStudent) {
	const [created] = await db.insert(schema.students).values(data).returning();
	return findById(created.id);
}

export async function update(id: string, data: Partial<schema.NewStudent>) {
	const [updated] = await db
		.update(schema.students)
		.set(data)
		.where(eq(schema.students.id, id))
		.returning();
	if (!updated) return null;
	return findById(updated.id);
}

export async function findById(id: string) {
	const [item] = await baseQuery().where(eq(schema.students.id, id)).limit(1);
	return item ?? null;
}

export async function list(opts: {
	classId?: string;
	q?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	let condition: SQL<unknown> | undefined;
	if (opts.classId) {
		condition = eq(schema.students.class, opts.classId);
	}
	if (opts.q) {
		const likeValue = `%${opts.q}%`;
		const qCond = or(
			ilike(schema.domainUsers.firstName, likeValue),
			ilike(schema.domainUsers.lastName, likeValue),
			ilike(schema.domainUsers.primaryEmail, likeValue),
			ilike(schema.students.registrationNumber, likeValue),
		);
		condition = condition ? and(condition, qCond) : qCond;
	}
	if (opts.cursor) {
		const cursorCond = gt(schema.students.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}

	const items = await baseQuery()
		.where(condition)
		.orderBy(schema.students.id)
		.limit(limit);
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function transferStudent(studentId: string, toClassId: string) {
	const [updated] = await db
		.update(schema.students)
		.set({ class: toClassId })
		.where(eq(schema.students.id, studentId))
		.returning();
	if (!updated) return null;
	return findById(updated.id);
}

export async function findByRegistrationNumber(registrationNumber: string) {
	const [item] = await baseQuery()
		.where(eq(schema.students.registrationNumber, registrationNumber))
		.limit(1);
	return item ?? null;
}
