import { TRPCError } from "@trpc/server";
import * as repo from "../repositories/exams.repo";
import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq, sql } from "drizzle-orm";

export async function createExam(data: Parameters<typeof repo.create>[0]) {
  let created;
  await db.transaction(async (tx) => {
    const [{ total }] = await tx
      .select({ total: sql<number>`coalesce(sum(${schema.exams.percentage}),0)` })
      .from(schema.exams)
      .where(eq(schema.exams.classCourse, data.classCourse));
    if (Number(total) + Number(data.percentage) > 100) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Percentage exceeds 100" });
    }
    [created] = await tx.insert(schema.exams).values(data).returning();
  });
  return created;
}

export async function updateExam(id: string, data: Parameters<typeof repo.update>[1]) {
  const existing = await repo.findById(id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  if (existing.isLocked) throw new TRPCError({ code: "FORBIDDEN" });
  if (data.percentage !== undefined) {
    await db.transaction(async (tx) => {
      const [{ total }] = await tx
        .select({ total: sql<number>`coalesce(sum(${schema.exams.percentage}),0)` })
        .from(schema.exams)
        .where(eq(schema.exams.classCourse, existing.classCourse));
      const newTotal = Number(total) - Number(existing.percentage) + Number(data.percentage);
      if (newTotal > 100) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Percentage exceeds 100" });
      }
      await tx
        .update(schema.exams)
        .set(data)
        .where(eq(schema.exams.id, id));
    });
    return repo.findById(id);
  }
  return repo.update(id, data);
}

export async function deleteExam(id: string) {
  const existing = await repo.findById(id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  if (existing.isLocked) throw new TRPCError({ code: "FORBIDDEN" });
  await repo.remove(id);
}

export async function listExams(opts: Parameters<typeof repo.list>[0]) {
  return repo.list(opts);
}

export async function getExamById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND" });
  return item;
}

export async function setLock(examId: string, lock: boolean) {
  const existing = await repo.findById(examId);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  return repo.setLock(examId, lock);
}
