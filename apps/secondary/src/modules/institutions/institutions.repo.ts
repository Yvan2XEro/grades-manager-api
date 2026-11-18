import { eq } from "drizzle-orm";
import { db } from "../../db";
import { institutions } from "../../db/schema";

export async function findById(id: string) {
	const rows = await db
		.select()
		.from(institutions)
		.where(eq(institutions.id, id))
		.limit(1);
	return rows[0] ?? null;
}

export async function updateById(
	id: string,
	data: Partial<Omit<typeof institutions.$inferInsert, "id">>,
) {
	const [row] = await db
		.update(institutions)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(institutions.id, id))
		.returning();
	return row!;
}
