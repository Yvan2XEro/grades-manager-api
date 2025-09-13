import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq, ilike, and, gt } from "drizzle-orm";

export async function create(data: schema.NewStudent) {
  const [item] = await db.insert(schema.students).values(data).returning();
  return item;
}

export async function update(id: string, data: Partial<schema.NewStudent>) {
  const [item] = await db
    .update(schema.students)
    .set(data)
    .where(eq(schema.students.id, id))
    .returning();
  return item;
}

export async function findById(id: string) {
  return db.query.students.findFirst({ where: eq(schema.students.id, id) });
}

export async function list(opts: { classId?: string; q?: string; cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  let condition;
  if (opts.classId) {
    condition = eq(schema.students.class, opts.classId);
  }
  if (opts.q) {
    const qCond = ilike(schema.students.firstName, `%${opts.q}%`);
    condition = condition ? and(condition, qCond) : qCond;
  }
  if (opts.cursor) {
    const cursorCond = gt(schema.students.id, opts.cursor);
    condition = condition ? and(condition, cursorCond) : cursorCond;
  }
  const items = await db
    .select()
    .from(schema.students)
    .where(condition)
    .orderBy(schema.students.id)
    .limit(limit);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}

export async function transferStudent(studentId: string, toClassId: string) {
  const [item] = await db
    .update(schema.students)
    .set({ class: toClassId })
    .where(eq(schema.students.id, studentId))
    .returning();
  return item;
}
