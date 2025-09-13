import { TRPCError } from "@trpc/server";
import * as repo from "./profiles.repo";

export async function getProfileById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

export async function getProfileByEmail(email: string) {
	const item = await repo.findByEmail(email);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

export async function listProfiles(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function updateRole(profileId: string, role: string) {
	const existing = await repo.findById(profileId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	return repo.updateRole(profileId, role);
}
