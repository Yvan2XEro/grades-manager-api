import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "./teaching-units.repo";

async function ensureProgram(programId: string, institutionId: string) {
	const program = await db.query.programs.findFirst({
		where: and(
			eq(schema.programs.id, programId),
			eq(schema.programs.institutionId, institutionId),
		),
	});
	if (!program) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
	}
	return program;
}

export async function createUnit(
	data: schema.NewTeachingUnit,
	institutionId: string,
) {
	await ensureProgram(data.programId, institutionId);
	return repo.create(data);
}

export async function updateUnit(
	id: string,
	institutionId: string,
	data: Partial<schema.NewTeachingUnit>,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	if (data.programId && data.programId !== existing.programId) {
		await ensureProgram(data.programId, institutionId);
	}
	return repo.update(id, institutionId, data);
}

export async function deleteUnit(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	await repo.remove(id, institutionId);
}

export async function getUnitById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

export async function listUnits(
	opts: Parameters<typeof repo.list>[1],
	institutionId: string,
) {
	return repo.list(institutionId, opts);
}
