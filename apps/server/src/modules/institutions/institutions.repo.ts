import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function getFirst() {
	const [institution] = await db.select().from(schema.institutions).limit(1);
	return institution ?? null;
}

export async function getById(id: string) {
	const [institution] = await db
		.select()
		.from(schema.institutions)
		.where(eq(schema.institutions.id, id));
	return institution ?? null;
}

export async function list() {
	return db.select().from(schema.institutions);
}

export async function create(data: schema.NewInstitution) {
	const [created] = await db
		.insert(schema.institutions)
		.values(data)
		.returning();
	return created;
}

export async function update(id: string, data: Partial<schema.NewInstitution>) {
	const [updated] = await db
		.update(schema.institutions)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(schema.institutions.id, id))
		.returning();
	return updated ?? null;
}

export async function deleteById(id: string) {
	const [deleted] = await db
		.delete(schema.institutions)
		.where(eq(schema.institutions.id, id))
		.returning();
	return deleted ?? null;
}
