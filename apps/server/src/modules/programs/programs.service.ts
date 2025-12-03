import { TRPCError } from "@trpc/server";
import { slugify } from "@/lib/strings";
import * as repo from "./programs.repo";
import * as programOptionsRepo from "../program-options/program-options.repo";

export async function createProgram(data: Parameters<typeof repo.create>[0]) {
	const slug = slugify(data.name);
	const program = await repo.create({ ...data, slug });
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
