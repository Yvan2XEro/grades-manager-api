import { conflict, notFound } from "../../lib/errors";
import * as repo from "./subject-assignments.repo";

export async function list(
	institutionId: string,
	academicYearId: string,
	classId?: string,
	staffId?: string,
) {
	return repo.findAll(institutionId, academicYearId, classId, staffId);
}

export async function create(
	data: {
		staffId: string;
		subjectId: string;
		classId: string;
		academicYearId: string;
	},
	institutionId: string,
) {
	const existing = await repo.findDuplicate(
		data.staffId,
		data.subjectId,
		data.classId,
		data.academicYearId,
		institutionId,
	);
	if (existing) throw conflict("This assignment already exists");
	return repo.insert({ institutionId, ...data });
}

export async function remove(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Assignment not found");
	await repo.remove(id, institutionId);
}
