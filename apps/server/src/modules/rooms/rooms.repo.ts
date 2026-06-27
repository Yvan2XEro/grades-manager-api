import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import type { NewRoom } from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";

export async function create(data: NewRoom) {
	const [row] = await db.insert(schema.rooms).values(data).returning();
	return row;
}

export async function findById(id: string, institutionId: string) {
	return db.query.rooms.findFirst({
		where: and(
			eq(schema.rooms.id, id),
			eq(schema.rooms.institutionId, institutionId),
		),
	});
}

export async function list(
	institutionId: string,
	opts: { isActive?: boolean } = {},
) {
	const conditions = [eq(schema.rooms.institutionId, institutionId)];
	if (opts.isActive !== undefined)
		conditions.push(eq(schema.rooms.isActive, opts.isActive));
	return db.query.rooms.findMany({
		where: and(...conditions),
		orderBy: (t, { asc }) => [asc(t.code)],
	});
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<Omit<schema.Room, "id" | "institutionId" | "createdAt">>,
) {
	const [row] = await db
		.update(schema.rooms)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(schema.rooms.id, id),
				eq(schema.rooms.institutionId, institutionId),
			),
		)
		.returning();
	return row;
}

export async function remove(id: string, institutionId: string) {
	const [row] = await db
		.delete(schema.rooms)
		.where(
			and(
				eq(schema.rooms.id, id),
				eq(schema.rooms.institutionId, institutionId),
			),
		)
		.returning();
	return row;
}
