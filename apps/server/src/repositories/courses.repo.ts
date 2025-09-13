import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq, and, gt } from "drizzle-orm";

export async function create(data: schema.NewCourse) {
  const [item] = await db.insert(schema.courses).values(data).returning();
  return item;
}

export async function update(id: string, data: Partial<schema.NewCourse>) {
  const [item] = await db
    .update(schema.courses)
    .set(data)
    .where(eq(schema.courses.id, id))
    .returning();
  return item;
}

export async function remove(id: string) {
  await db.delete(schema.courses).where(eq(schema.courses.id, id));
}

export async function findById(id: string) {
  return db.query.courses.findFirst({ where: eq(schema.courses.id, id) });
}

export async function list(opts: { programId?: string; cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  let condition;
  if (opts.programId) {
    condition = eq(schema.courses.program, opts.programId);
  }
  if (opts.cursor) {
    const cursorCond = gt(schema.courses.id, opts.cursor);
    condition = condition ? and(condition, cursorCond) : cursorCond;
  }
  const items = await db
    .select()
    .from(schema.courses)
    .where(condition)
    .orderBy(schema.courses.id)
    .limit(limit);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}

export async function assignDefaultTeacher(courseId: string, teacherId: string) {
  const [item] = await db
    .update(schema.courses)
    .set({ defaultTeacher: teacherId })
    .where(eq(schema.courses.id, courseId))
    .returning();
  return item;
}
