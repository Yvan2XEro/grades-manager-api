import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function getFirst() {
	const [institution] = await db.select().from(schema.institutions).limit(1);
	return institution ?? null;
}

export async function create(data: schema.NewInstitution) {
	const [created] = await db.insert(schema.institutions).values(data).returning();
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
