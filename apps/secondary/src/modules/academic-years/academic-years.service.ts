import { notFound } from "../../lib/errors";
import * as repo from "./academic-years.repo";

export async function list(institutionId: string) {
	return repo.findAll(institutionId);
}

export async function create(
	data: {
		name: string;
		startDate: Date;
		endDate: Date;
		assessmentMode?: string;
	},
	institutionId: string,
) {
	return repo.insert({
		institutionId,
		name: data.name,
		startDate: data.startDate,
		endDate: data.endDate,
		assessmentMode: data.assessmentMode ?? "six_sequence",
		status: "active",
	});
}

export async function setActive(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Academic year not found");
	const updated = await repo.setStatus(id, institutionId, "active");
	return updated!;
}

export async function close(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Academic year not found");
	const updated = await repo.setStatus(id, institutionId, "closed");
	return updated!;
}
