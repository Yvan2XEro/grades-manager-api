import { eq } from "drizzle-orm";
import * as schema from "../../db/schema/app-schema";
import * as studentsRepo from "@/modules/students/students.repo";
import { transaction } from "../_shared/db-transaction";
import { notFound } from "../_shared/errors";
import * as repo from "./classes.repo";

export async function createClass(data: Parameters<typeof repo.create>[0]) {
	return repo.create(data);
}

export async function updateClass(
	id: string,
	data: Parameters<typeof repo.update>[1],
) {
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
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
	if (!item) throw notFound();
	return item;
}

export async function transferStudent(studentId: string, toClassId: string) {
	const student = await studentsRepo.findById(studentId);
	if (!student) throw notFound("Student not found");
	const target = await repo.findById(toClassId);
	if (!target) throw notFound("Class not found");
	await transaction(async (tx) => {
		await tx
			.update(schema.students)
			.set({ class: toClassId })
			.where(eq(schema.students.id, studentId));
	});
	return studentsRepo.findById(studentId);
}
