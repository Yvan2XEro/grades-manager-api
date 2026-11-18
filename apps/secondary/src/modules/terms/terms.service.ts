import { conflict, notFound } from "../../lib/errors";
import * as repo from "./terms.repo";

export async function list(academicYearId: string, institutionId: string) {
	return repo.findByYear(academicYearId, institutionId);
}

export async function create(
	data: {
		academicYearId: string;
		termNumber: number;
		startDate: Date;
		endDate: Date;
	},
	institutionId: string,
) {
	const existing = await repo.findByYearAndNumber(
		data.academicYearId,
		data.termNumber,
		institutionId,
	);
	if (existing) throw conflict("TERM_ALREADY_EXISTS");
	return repo.insert({
		institutionId,
		academicYearId: data.academicYearId,
		termNumber: data.termNumber,
		startDate: data.startDate,
		endDate: data.endDate,
		status: "open",
	});
}

export async function open(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("TERM_NOT_FOUND");
	const updated = await repo.setStatus(id, institutionId, "open");
	return updated!;
}

export async function close(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("TERM_NOT_FOUND");
	const updated = await repo.setStatus(id, institutionId, "closed");
	return updated!;
}

export async function getActive(academicYearId: string, institutionId: string) {
	return repo.findActive(academicYearId, institutionId);
}
