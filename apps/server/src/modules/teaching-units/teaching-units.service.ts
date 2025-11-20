import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "./teaching-units.repo";

async function ensureProgram(programId: string) {
	const program = await db.query.programs.findFirst({
		where: eq(schema.programs.id, programId),
	});
	if (!program) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
	}
	return program;
}

export async function createUnit(data: schema.NewTeachingUnit) {
	await ensureProgram(data.programId);
	return repo.create(data);
}

export async function updateUnit(
	id: string,
	data: Partial<schema.NewTeachingUnit>,
) {
	if (data.programId) {
		await ensureProgram(data.programId);
	}
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	return repo.update(id, data);
}

export async function deleteUnit(id: string) {
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	await repo.remove(id);
}

export async function getUnitById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

export async function listUnits(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}
