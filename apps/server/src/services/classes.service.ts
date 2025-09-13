import { TRPCError } from "@trpc/server";
import * as repo from "../repositories/classes.repo";
import * as studentsRepo from "../repositories/students.repo";
import { db } from "../db";
import * as schema from "../db/schema/app-schema";
import { eq } from "drizzle-orm";

export async function createClass(data: Parameters<typeof repo.create>[0]) {
  return repo.create(data);
}

export async function updateClass(id: string, data: Parameters<typeof repo.update>[1]) {
  const existing = await repo.findById(id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  return repo.update(id, data);
}

export async function deleteClass(id: string) {
  await repo.remove(id);
}

export async function listClasses(opts: Parameters<typeof repo.list>[0]) {
  return repo.list(opts);
}

export async function getClassById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND" });
  return item;
}

export async function transferStudent(studentId: string, toClassId: string) {
  const student = await studentsRepo.findById(studentId);
  if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
  const target = await repo.findById(toClassId);
  if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
  await db.transaction(async (tx) => {
    await tx
      .update(schema.students)
      .set({ class: toClassId })
      .where(eq(schema.students.id, studentId));
  });
  return studentsRepo.findById(studentId);
}
