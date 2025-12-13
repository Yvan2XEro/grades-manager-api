import type { NewInstitution } from "@/db/schema/app-schema";
import * as repo from "./institutions.repo";

type UpdatableFields = Omit<NewInstitution, "id" | "createdAt" | "updatedAt">;

export async function getInstitution() {
	const existing = await repo.getFirst();
	return existing ?? null;
}

export async function upsertInstitution(data: UpdatableFields & { id?: string }) {
	const existing = await repo.getFirst();
	if (existing) {
		return repo.update(existing.id, data);
	}
	return repo.create(data);
}
