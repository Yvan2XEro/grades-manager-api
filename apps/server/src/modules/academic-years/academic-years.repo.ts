import { eq, gt } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

export async function create(data: schema.NewAcademicYear) {
	const [item] = await db.insert(schema.academicYears).values(data).returning();
	return item;
}

export async function update(
	id: string,
	data: Partial<schema.NewAcademicYear>,
) {
	const [item] = await db
		.update(schema.academicYears)
		.set(data)
		.where(eq(schema.academicYears.id, id))
		.returning();
	return item;
}

export async function remove(id: string) {
	await db.delete(schema.academicYears).where(eq(schema.academicYears.id, id));
}

export async function findById(id: string) {
	return db.query.academicYears.findFirst({
		where: eq(schema.academicYears.id, id),
	});
}

export async function list(opts: { cursor?: string; limit?: number }) {
        const limit = opts.limit ?? 50;
        const condition = opts.cursor
                ? gt(schema.academicYears.id, opts.cursor)
                : undefined;
        const items = await db
                .select()
                .from(schema.academicYears)
		.where(condition)
		.orderBy(schema.academicYears.id)
		.limit(limit);
	return paginate(items, limit);
}
