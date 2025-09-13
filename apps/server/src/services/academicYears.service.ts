import { TRPCError } from "@trpc/server";
import * as repo from "../repositories/academicYears.repo";
import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq } from "drizzle-orm";

export async function createAcademicYear(data: Parameters<typeof repo.create>[0]) {
  return repo.create(data);
}

export async function updateAcademicYear(id: string, data: Parameters<typeof repo.update>[1]) {
  const existing = await repo.findById(id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  return repo.update(id, data);
}

export async function listAcademicYears(opts: Parameters<typeof repo.list>[0]) {
  return repo.list(opts);
}

export async function getAcademicYearById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND" });
  return item;
}

export async function setActive(id: string, isActive: boolean) {
  await db.transaction(async (tx) => {
    if (isActive) {
      await tx.update(schema.academicYears).set({ isActive: false }).where(eq(schema.academicYears.isActive, true));
    }
    await tx.update(schema.academicYears).set({ isActive }).where(eq(schema.academicYears.id, id));
  });
  return repo.findById(id);
}
