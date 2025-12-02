import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "./program-options.repo";

async function ensureProgram(programId: string) {
	const program = await db.query.programs.findFirst({
		where: eq(schema.programs.id, programId),
	});
	if (!program) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Program not found",
		});
	}
	return program;
}

async function ensureOption(id: string) {
	const option = await repo.findById(id);
	if (!option) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Program option not found" });
	}
	return option;
}

export async function createOption(data: schema.NewProgramOption) {
	await ensureProgram(data.programId);
	return repo.create(data);
}

export async function updateOption(
	id: string,
	data: Partial<schema.NewProgramOption>,
) {
	const existing = await ensureOption(id);
	if (data.programId && data.programId !== existing.programId) {
		await ensureProgram(data.programId);
	}
	return repo.update(id, data);
}

export async function deleteOption(id: string) {
	await ensureOption(id);
	await repo.remove(id);
}

export async function listOptions(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getOptionById(id: string) {
	const option = await repo.findById(id);
	if (!option) {
		throw new TRPCError({ code: "NOT_FOUND" });
	}
	return option;
}
