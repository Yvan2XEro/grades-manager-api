import { conflict, notFound } from "../../lib/errors";
import * as repo from "./enrollments.repo";

export async function list(
	institutionId: string,
	academicYearId: string,
	classId?: string,
	opts: { search?: string; page?: number; pageSize?: number } = {},
) {
	const { items, total } = await repo.findAll(
		institutionId,
		academicYearId,
		classId,
		opts,
	);
	return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 25 };
}

export async function create(
	data: {
		studentId: string;
		academicYearId: string;
		classId: string;
		admissionType?: string;
	},
	institutionId: string,
) {
	const existing = await repo.findByStudentAndYear(
		data.studentId,
		data.academicYearId,
		institutionId,
	);
	if (existing)
		throw conflict("Student already enrolled in this academic year");
	return repo.insert({
		institutionId,
		studentId: data.studentId,
		academicYearId: data.academicYearId,
		classId: data.classId,
		admissionType: data.admissionType ?? "new",
		status: "active",
	});
}

export async function updateStatus(
	id: string,
	institutionId: string,
	status: string,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Enrollment not found");
	const updated = await repo.updateStatus(id, institutionId, status);
	return updated!;
}

export async function countActive(
	institutionId: string,
	academicYearId?: string,
) {
	return repo.countActive(institutionId, academicYearId);
}
