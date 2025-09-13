import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq, gt } from "drizzle-orm";

export async function findById(id: string) {
  return db.query.profiles.findFirst({ where: eq(schema.profiles.id, id) });
}

export async function findByEmail(email: string) {
  return db.query.profiles.findFirst({ where: eq(schema.profiles.email, email) });
}

export async function list(opts: { cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 50;
  let condition;
  if (opts.cursor) {
    condition = gt(schema.profiles.id, opts.cursor);
  }
  const items = await db
    .select()
    .from(schema.profiles)
    .where(condition)
    .orderBy(schema.profiles.id)
    .limit(limit);
  const nextCursor = items.length === limit ? items[items.length - 1].id : undefined;
  return { items, nextCursor };
}

export async function updateRole(id: string, role: string) {
  const [item] = await db
    .update(schema.profiles)
    .set({ role })
    .where(eq(schema.profiles.id, id))
    .returning();
  return item;
}
