import { TRPCError } from "@trpc/server";
import * as repo from "../repositories/classCourses.repo";

export async function createClassCourse(data: Parameters<typeof repo.create>[0]) {
  return repo.create(data);
}

export async function updateClassCourse(id: string, data: Parameters<typeof repo.update>[1]) {
  const existing = await repo.findById(id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  return repo.update(id, data);
}

export async function deleteClassCourse(id: string) {
  await repo.remove(id);
}

export async function listClassCourses(opts: Parameters<typeof repo.list>[0]) {
  return repo.list(opts);
}

export async function getClassCourseById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND" });
  return item;
}
