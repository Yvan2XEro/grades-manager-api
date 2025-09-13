import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq, and, gt, gte, lte } from "drizzle-orm";

export async function create(data: schema.NewExam) {
  const [item] = await db.insert(schema.exams).values(data).returning();
  return item;
}

export async function update(id: string, data: Partial<schema.NewExam>) {
  const [item] = await db
    .update(schema.exams)
    .set(data)
    .where(eq(schema.exams.id, id))
    .returning();
  return item;
}

export async function remove(id: string) {
  await db.delete(schema.exams).where(eq(schema.exams.id, id));
}

export async function findById(id: string) {
  return db.query.exams.findFirst({ where: eq(schema.exams.id, id) });
}

export async function list(opts: { classCourseId?: string; dateFrom?: Date; dateTo?: Date; cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  let condition;
  if (opts.classCourseId) {
    condition = eq(schema.exams.classCourse, opts.classCourseId);
  }
  if (opts.dateFrom) {
    const c = gte(schema.exams.date, opts.dateFrom);
    condition = condition ? and(condition, c) : c;
  }
  if (opts.dateTo) {
    const c = lte(schema.exams.date, opts.dateTo);
    condition = condition ? and(condition, c) : c;
  }
  if (opts.cursor) {
    const cursorCond = gt(schema.exams.id, opts.cursor);
    condition = condition ? and(condition, cursorCond) : cursorCond;
  }
  const items = await db
    .select()
    .from(schema.exams)
    .where(condition)
    .orderBy(schema.exams.id)
    .limit(limit);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}

export async function setLock(examId: string, lock: boolean) {
  const [item] = await db
    .update(schema.exams)
    .set({ isLocked: lock })
    .where(eq(schema.exams.id, examId))
    .returning();
  return item;
}
