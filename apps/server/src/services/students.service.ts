import { TRPCError } from "@trpc/server";
import * as repo from "../repositories/students.repo";

export async function createStudent(data: Parameters<typeof repo.create>[0]) {
  try {
    return await repo.create(data);
  } catch (e) {
    throw new TRPCError({ code: "CONFLICT" });
  }
}

export async function updateStudent(id: string, data: Parameters<typeof repo.update>[1]) {
  const existing = await repo.findById(id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  return repo.update(id, data);
}

export async function listStudents(opts: Parameters<typeof repo.list>[0]) {
  return repo.list(opts);
}

export async function getStudentById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND" });
  return item;
}
