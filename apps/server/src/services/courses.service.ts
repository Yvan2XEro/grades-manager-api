import { TRPCError } from "@trpc/server";
import * as repo from "../repositories/courses.repo";

export async function createCourse(data: Parameters<typeof repo.create>[0]) {
  return repo.create(data);
}

export async function updateCourse(id: string, data: Parameters<typeof repo.update>[1]) {
  const existing = await repo.findById(id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  return repo.update(id, data);
}

export async function deleteCourse(id: string) {
  await repo.remove(id);
}

export async function listCourses(opts: Parameters<typeof repo.list>[0]) {
  return repo.list(opts);
}

export async function getCourseById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND" });
  return item;
}

export async function assignDefaultTeacher(courseId: string, teacherId: string) {
  const existing = await repo.findById(courseId);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  return repo.assignDefaultTeacher(courseId, teacherId);
}
