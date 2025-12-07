import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function list(opts: { includeInactive?: boolean } = {}) {
	const where = opts.includeInactive
		? undefined
		: eq(schema.registrationNumberFormats.isActive, true);
	return db
		.select()
		.from(schema.registrationNumberFormats)
		.where(where)
		.orderBy(
			desc(schema.registrationNumberFormats.isActive),
			desc(schema.registrationNumberFormats.createdAt),
		);
}

export async function findById(id: string) {
	const [item] = await db
		.select()
		.from(schema.registrationNumberFormats)
		.where(eq(schema.registrationNumberFormats.id, id))
		.limit(1);
	return item ?? null;
}

export async function findActive() {
	const [item] = await db
		.select()
		.from(schema.registrationNumberFormats)
		.where(eq(schema.registrationNumberFormats.isActive, true))
		.limit(1);
	return item ?? null;
}

export async function create(
	data: schema.NewRegistrationNumberFormat,
	agent = db,
) {
	const [item] = await agent
		.insert(schema.registrationNumberFormats)
		.values(data)
		.returning();
	return item;
}

export async function update(
	id: string,
	data: Partial<schema.NewRegistrationNumberFormat>,
	agent = db,
) {
	const [item] = await agent
		.update(schema.registrationNumberFormats)
		.set(data)
		.where(eq(schema.registrationNumberFormats.id, id))
		.returning();
	return item ?? null;
}

export async function remove(id: string) {
	await db
		.delete(schema.registrationNumberFormats)
		.where(eq(schema.registrationNumberFormats.id, id));
}
