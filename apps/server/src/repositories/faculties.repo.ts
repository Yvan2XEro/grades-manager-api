import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq, ilike, and, gt } from "drizzle-orm";

export async function create(data: schema.NewFaculty) {
  const [item] = await db.insert(schema.faculties).values(data).returning();
  return item;
}

export async function update(id: string, data: Partial<schema.NewFaculty>) {
  const [item] = await db
    .update(schema.faculties)
    .set(data)
    .where(eq(schema.faculties.id, id))
    .returning();
  return item;
}

export async function remove(id: string) {
  await db.delete(schema.faculties).where(eq(schema.faculties.id, id));
}

export async function findById(id: string) {
  return db.query.faculties.findFirst({ where: eq(schema.faculties.id, id) });
}

export async function list(opts: { q?: string; cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  let condition;
  if (opts.q) {
    condition = ilike(schema.faculties.name, `%${opts.q}%`);
  }
  if (opts.cursor) {
    const cursorCond = gt(schema.faculties.id, opts.cursor);
    condition = condition ? and(condition, cursorCond) : cursorCond;
  }
  const items = await db
    .select()
    .from(schema.faculties)
    .where(condition)
    .orderBy(schema.faculties.id)
    .limit(limit);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}
