import { normalizeCode } from "@/lib/strings";
import { notFound } from "../_shared/errors";
import * as repo from "./faculties.repo";

type CreateInput = Parameters<typeof repo.create>[0];
type UpdateInput = Parameters<typeof repo.update>[2];
type ListInput = Parameters<typeof repo.list>[1];
type SearchInput = Parameters<typeof repo.search>[0];

export async function createFaculty(data: CreateInput, institutionId: string) {
	return repo.create({
		...data,
		code: normalizeCode(data.code),
		institutionId,
	});
}

export async function updateFaculty(
	id: string,
	institutionId: string,
	data: UpdateInput,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound();
	return repo.update(id, institutionId, {
		...data,
		code: data.code ? normalizeCode(data.code) : undefined,
	});
}

export async function deleteFaculty(id: string, institutionId: string) {
	await repo.remove(id, institutionId);
}

export async function listFaculties(opts: ListInput, institutionId: string) {
	return repo.list(institutionId, opts);
}

export async function getFacultyById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw notFound();
	return item;
}

export async function getFacultyByCode(code: string, institutionId: string) {
	const normalized = normalizeCode(code);
	const item = await repo.findByCode(normalized, institutionId);
	if (!item) throw notFound();
	return item;
}

export async function searchFaculties(
	opts: Omit<SearchInput, "institutionId">,
	institutionId: string,
) {
	return repo.search({ ...opts, institutionId });
}
