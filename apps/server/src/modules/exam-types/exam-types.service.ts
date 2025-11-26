import { TRPCError } from "@trpc/server";
import * as repo from "./exam-types.repo";

export function createExamType(data: Parameters<typeof repo.create>[0]) {
	return repo.create(data);
}

export async function updateExamType(
	id: string,
	data: Parameters<typeof repo.update>[1],
) {
	const updated = await repo.update(id, data);
	if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
	return updated;
}

export async function deleteExamType(id: string) {
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	await repo.remove(id);
}

export function getExamTypeById(id: string) {
	return repo.findById(id);
}

export function listExamTypes(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}
