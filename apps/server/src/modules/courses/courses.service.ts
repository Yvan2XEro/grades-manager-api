import { notFound } from "../_shared/errors";
import * as repo from "./courses.repo";

export async function createCourse(data: Parameters<typeof repo.create>[0]) {
	return repo.create(data);
}

export async function updateCourse(
	id: string,
	data: Parameters<typeof repo.update>[1],
) {
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
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
	if (!item) throw notFound();
	return item;
}

export async function assignDefaultTeacher(
	courseId: string,
	teacherId: string,
) {
	const existing = await repo.findById(courseId);
	if (!existing) throw notFound();
	return repo.assignDefaultTeacher(courseId, teacherId);
}
