import { TRPCError } from "@trpc/server";
import * as repo from "./programs.repo";

export async function createProgram(data: Parameters<typeof repo.create>[0]) {
	return repo.create(data);
}

export async function updateProgram(
	id: string,
	data: Parameters<typeof repo.update>[1],
) {
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	return repo.update(id, data);
}

export async function deleteProgram(id: string) {
	await repo.remove(id);
}

export async function listPrograms(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getProgramById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}
