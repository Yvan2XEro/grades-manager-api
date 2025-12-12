import { TRPCError } from "@trpc/server";
import { normalizeCode, slugify } from "@/lib/strings";
import * as programOptionsRepo from "../program-options/program-options.repo";
import * as repo from "./programs.repo";

export async function createProgram(data: Parameters<typeof repo.create>[0]) {
	const slug = slugify(data.name);
	const program = await repo.create({
		...data,
		code: normalizeCode(data.code),
		slug,
	});
	await programOptionsRepo.create({
		programId: program.id,
		name: "Default option",
		code: "default",
		description: "Auto-generated option",
	});
	return program;
}

export async function updateProgram(
	id: string,
	data: Parameters<typeof repo.update>[1],
) {
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	const payload = {
		...data,
		slug: data.name ? slugify(data.name) : undefined,
		code: data.code ? normalizeCode(data.code) : undefined,
	};
	return repo.update(id, payload);
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

export async function getProgramByCode(code: string, facultyId: string) {
	const normalized = normalizeCode(code);
	const item = await repo.findByCode(normalized, facultyId);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

export async function searchPrograms(opts: Parameters<typeof repo.search>[0]) {
	return repo.search(opts);
}
