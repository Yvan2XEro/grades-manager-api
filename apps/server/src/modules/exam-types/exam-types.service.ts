import { TRPCError } from "@trpc/server";
import * as repo from "./exam-types.repo";

type CreateInput = Parameters<typeof repo.create>[0];
type UpdateInput = Parameters<typeof repo.update>[2];
type ListInput = Parameters<typeof repo.list>[1];

export async function createExamType(data: CreateInput, institutionId: string) {
	return repo.create({ ...data, institutionId });
}

export async function updateExamType(
	id: string,
	institutionId: string,
	data: UpdateInput,
) {
	const updated = await repo.update(id, institutionId, data);
	if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
	return updated;
}

export async function deleteExamType(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	await repo.remove(id, institutionId);
}

export function getExamTypeById(id: string, institutionId: string) {
	return repo.findById(id, institutionId);
}

export function listExamTypes(opts: ListInput, institutionId: string) {
	return repo.list(institutionId, opts);
}
