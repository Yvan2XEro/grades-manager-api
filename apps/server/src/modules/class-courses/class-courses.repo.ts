import { and, eq, gt } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

export async function create(data: schema.NewClassCourse) {
	const [item] = await db.insert(schema.classCourses).values(data).returning();
	return item;
}

export async function update(id: string, data: Partial<schema.NewClassCourse>) {
	const [item] = await db
		.update(schema.classCourses)
		.set(data)
		.where(eq(schema.classCourses.id, id))
		.returning();
	return item;
}

export async function remove(id: string) {
	await db.delete(schema.classCourses).where(eq(schema.classCourses.id, id));
}

export async function findById(id: string) {
	return db.query.classCourses.findFirst({
		where: eq(schema.classCourses.id, id),
	});
}

export async function list(opts: {
	classId?: string;
	courseId?: string;
	teacherId?: string;
	cursor?: string;
	limit?: number;
}) {
        const limit = opts.limit ?? 50;
        const conditions = [
                opts.classId ? eq(schema.classCourses.class, opts.classId) : undefined,
                opts.courseId ? eq(schema.classCourses.course, opts.courseId) : undefined,
                opts.teacherId ? eq(schema.classCourses.teacher, opts.teacherId) : undefined,
                opts.cursor ? gt(schema.classCourses.id, opts.cursor) : undefined,
        ].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
        const condition =
                conditions.length === 0
                        ? undefined
                        : conditions.length === 1
                                ? conditions[0]
                                : and(...conditions);
        const items = await db
                .select()
                .from(schema.classCourses)
		.where(condition)
		.orderBy(schema.classCourses.id)
		.limit(limit);
	return paginate(items, limit);
}
