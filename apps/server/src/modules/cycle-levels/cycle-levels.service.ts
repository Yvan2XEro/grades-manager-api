import { normalizeCode } from "@/lib/strings";
import { notFound } from "../_shared/errors";
import * as repo from "./cycle-levels.repo";

export async function createCycleLevel(
	data: Parameters<typeof repo.create>[0],
) {
	return repo.create({ ...data, code: normalizeCode(data.code) });
}

export async function updateCycleLevel(
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

export async function deleteCycleLevel(id: string) {
	await repo.remove(id);
}

export async function listCycleLevels(
	opts: Parameters<typeof repo.list>[0],
) {
	return repo.list(opts);
}

export async function getCycleLevelById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw notFound();
	return item;
}

export async function getCycleLevelByCode(code: string, cycleId: string) {
	const normalized = normalizeCode(code);
	const item = await repo.findByCode(normalized, cycleId);
	if (!item) throw notFound();
	return item;
}

export async function searchCycleLevels(
	opts: Parameters<typeof repo.search>[0],
) {
	return repo.search(opts);
}
