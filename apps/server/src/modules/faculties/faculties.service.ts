import { normalizeCode } from "@/lib/strings";
import { notFound } from "../_shared/errors";
import * as repo from "./faculties.repo";

export async function createFaculty(data: Parameters<typeof repo.create>[0]) {
	return repo.create({ ...data, code: normalizeCode(data.code) });
}

export async function updateFaculty(
	id: string,
	data: Parameters<typeof repo.update>[1],
) {
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
	return repo.update(id, {
		...data,
		code: data.code ? normalizeCode(data.code) : undefined,
	});
}

export async function deleteFaculty(id: string) {
	await repo.remove(id);
}

export async function listFaculties(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getFacultyById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw notFound();
	return item;
}

export async function getFacultyByCode(code: string) {
	const normalized = normalizeCode(code);
	const item = await repo.findByCode(normalized);
	if (!item) throw notFound();
	return item;
}

export async function searchFaculties(opts: Parameters<typeof repo.search>[0]) {
	return repo.search(opts);
}
