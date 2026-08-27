import { notFound } from "../../lib/errors";
import * as repo from "./students.repo";

export async function list(
	institutionId: string,
	opts: { search?: string; limit?: number; offset?: number },
) {
	return repo.findAll(institutionId, opts);
}

export async function create(
	data: Parameters<typeof repo.insert>[0],
	institutionId: string,
) {
	return repo.insert({ ...data, institutionId });
}

export async function get(id: string, institutionId: string) {
	const student = await repo.findById(id, institutionId);
	if (!student) throw notFound("Student not found");
	return student;
}

export async function updateStudent(
	id: string,
	institutionId: string,
	data: Partial<typeof import("../../db/schema").students.$inferInsert>,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Student not found");
	const updated = await repo.update(id, institutionId, data);
	return updated!;
}

export async function count(institutionId: string) {
	return repo.countAll(institutionId);
}
