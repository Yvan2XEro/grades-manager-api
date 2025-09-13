import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq, and, gt } from "drizzle-orm";

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
  return db.query.classCourses.findFirst({ where: eq(schema.classCourses.id, id) });
}

export async function list(opts: { classId?: string; courseId?: string; teacherId?: string; cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  let condition;
  if (opts.classId) {
    condition = eq(schema.classCourses.class, opts.classId);
  }
  if (opts.courseId) {
    const cc = eq(schema.classCourses.course, opts.courseId);
    condition = condition ? and(condition, cc) : cc;
  }
  if (opts.teacherId) {
    const tc = eq(schema.classCourses.teacher, opts.teacherId);
    condition = condition ? and(condition, tc) : tc;
  }
  if (opts.cursor) {
    const cursorCond = gt(schema.classCourses.id, opts.cursor);
    condition = condition ? and(condition, cursorCond) : cursorCond;
  }
  const items = await db
    .select()
    .from(schema.classCourses)
    .where(condition)
    .orderBy(schema.classCourses.id)
    .limit(limit);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}
