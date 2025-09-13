import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq, ilike, and, gt } from "drizzle-orm";

export async function create(data: schema.NewProgram) {
  const [item] = await db.insert(schema.programs).values(data).returning();
  return item;
}

export async function update(id: string, data: Partial<schema.NewProgram>) {
  const [item] = await db
    .update(schema.programs)
    .set(data)
    .where(eq(schema.programs.id, id))
    .returning();
  return item;
}

export async function remove(id: string) {
  await db.delete(schema.programs).where(eq(schema.programs.id, id));
}

export async function findById(id: string) {
  return db.query.programs.findFirst({ where: eq(schema.programs.id, id) });
}

export async function list(opts: { facultyId?: string; q?: string; cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  let condition;
  if (opts.facultyId) {
    condition = eq(schema.programs.faculty, opts.facultyId);
  }
  if (opts.q) {
    const qCond = ilike(schema.programs.name, `%${opts.q}%`);
    condition = condition ? and(condition, qCond) : qCond;
  }
  if (opts.cursor) {
    const cursorCond = gt(schema.programs.id, opts.cursor);
    condition = condition ? and(condition, cursorCond) : cursorCond;
  }
  const items = await db
    .select()
    .from(schema.programs)
    .where(condition)
    .orderBy(schema.programs.id)
    .limit(limit);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}
