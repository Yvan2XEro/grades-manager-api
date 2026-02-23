import { TRPCError } from "@trpc/server";
import type { NewInstitution } from "@/db/schema/app-schema";
import * as repo from "./institutions.repo";

type UpdatableFields = Omit<NewInstitution, "id" | "createdAt" | "updatedAt">;

export async function getInstitution() {
	const existing = await repo.getFirst();
	return existing ?? null;
}

export async function getInstitutionById(id: string) {
	const institution = await repo.getById(id);
	if (!institution) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Institution not found",
		});
	}
	return institution;
}

export async function listInstitutions() {
	return repo.list();
}

export async function upsertInstitution(
	data: UpdatableFields & { id?: string },
) {
	const existing = await repo.getFirst();
	if (existing) {
		return repo.update(existing.id, data);
	}
	return repo.create(data);
}

export async function createInstitution(data: UpdatableFields) {
	return repo.create(data);
}

export async function updateInstitution(
	id: string,
	data: Partial<UpdatableFields>,
) {
	const existing = await repo.getById(id);
	if (!existing) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Institution not found",
		});
	}
	return repo.update(id, data);
}

export async function deleteInstitution(id: string) {
	const existing = await repo.getById(id);
	if (!existing) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Institution not found",
		});
	}
	return repo.deleteById(id);
}
