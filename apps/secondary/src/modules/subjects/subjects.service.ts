import { conflict, notFound } from "../../lib/errors";
import * as repo from "./subjects.repo";

export async function list(institutionId: string) {
	return repo.findAll(institutionId);
}

export async function create(
	data: {
		name: string;
		nameFr?: string;
		code: string;
		minesecCode?: string;
		subjectGroup?: string;
	},
	institutionId: string,
) {
	const existing = await repo.findByCode(data.code, institutionId);
	if (existing) throw conflict(`Subject code "${data.code}" already exists`);
	return repo.insert({
		institutionId,
		name: data.name,
		nameFr: data.nameFr ?? "",
		code: data.code,
		minesecCode: data.minesecCode,
		subjectGroup: data.subjectGroup,
	});
}

export async function updateSubject(
	id: string,
	institutionId: string,
	data: {
		name?: string;
		nameFr?: string;
		code?: string;
		minesecCode?: string;
		subjectGroup?: string;
	},
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Subject not found");
	if (data.code && data.code !== existing.code) {
		const duplicate = await repo.findByCode(data.code, institutionId);
		if (duplicate) throw conflict(`Subject code "${data.code}" already taken`);
	}
	const updated = await repo.update(id, institutionId, data);
	return updated!;
}
