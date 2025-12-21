import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "./program-options.repo";

async function ensureProgram(programId: string, institutionId: string) {
	const program = await db.query.programs.findFirst({
		where: and(
			eq(schema.programs.id, programId),
			eq(schema.programs.institutionId, institutionId),
		),
	});
	if (!program) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Program not found",
		});
	}
	return program;
}

async function ensureOption(id: string, institutionId: string) {
	const option = await repo.findById(id, institutionId);
	if (!option) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Program option not found",
		});
	}
	return option;
}

export async function createOption(
	data: schema.NewProgramOption,
	institutionId: string,
) {
	await ensureProgram(data.programId, institutionId);
	return repo.create({ ...data, institutionId });
}

export async function updateOption(
	id: string,
	institutionId: string,
	data: Partial<schema.NewProgramOption>,
) {
	const existing = await ensureOption(id, institutionId);
	if (data.programId && data.programId !== existing.programId) {
		await ensureProgram(data.programId, institutionId);
	}
	return repo.update(id, institutionId, data);
}

export async function deleteOption(id: string, institutionId: string) {
	await ensureOption(id, institutionId);
	await repo.remove(id, institutionId);
}

export async function listOptions(
	opts: Parameters<typeof repo.list>[0],
	institutionId: string,
) {
	return repo.list(opts, institutionId);
}

export async function getOptionById(id: string, institutionId: string) {
	const option = await repo.findById(id, institutionId);
	if (!option) {
		throw new TRPCError({ code: "NOT_FOUND" });
	}
	return option;
}

export async function searchProgramOptions(
	opts: Parameters<typeof repo.search>[0],
	institutionId: string,
) {
	return repo.search(opts, institutionId);
}
