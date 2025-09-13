import { and, eq, gt } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

export async function create(data: schema.NewKlass) {
	const [item] = await db.insert(schema.classes).values(data).returning();
	return item;
}

export async function update(id: string, data: Partial<schema.NewKlass>) {
	const [item] = await db
		.update(schema.classes)
		.set(data)
		.where(eq(schema.classes.id, id))
		.returning();
	return item;
}

export async function remove(id: string) {
	await db.delete(schema.classes).where(eq(schema.classes.id, id));
}

export async function findById(id: string) {
	return db.query.classes.findFirst({ where: eq(schema.classes.id, id) });
}

export async function list(opts: {
	programId?: string;
	academicYearId?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	let condition;
	if (opts.programId) {
		condition = eq(schema.classes.program, opts.programId);
	}
	if (opts.academicYearId) {
		const ay = eq(schema.classes.academicYear, opts.academicYearId);
		condition = condition ? and(condition, ay) : ay;
	}
	if (opts.cursor) {
		const cursorCond = gt(schema.classes.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	const items = await db
		.select()
		.from(schema.classes)
		.where(condition)
		.orderBy(schema.classes.id)
		.limit(limit);
	return paginate(items, limit);
}
