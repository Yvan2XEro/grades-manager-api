import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { academicYears } from "../../db/schema";

export async function findAll(institutionId: string) {
	return db
		.select()
		.from(academicYears)
		.where(eq(academicYears.institutionId, institutionId))
		.orderBy(academicYears.startDate);
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(academicYears)
		.where(
			and(
				eq(academicYears.id, id),
				eq(academicYears.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof academicYears.$inferInsert) {
	const [row] = await db.insert(academicYears).values(data).returning();
	return row!;
}

export async function setStatus(
	id: string,
	institutionId: string,
	status: "active" | "closed" | "archived",
) {
	const [row] = await db
		.update(academicYears)
		.set({ status, updatedAt: new Date() })
		.where(
			and(
				eq(academicYears.id, id),
				eq(academicYears.institutionId, institutionId),
			),
		)
		.returning();
	return row ?? null;
}
