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
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Program not found",
		});
	}
	return program;
}

/** The level must belong to the cycle of the unit's program. */
async function ensureLevel(
	program: schema.Program,
	cycleLevelId?: string | null,
) {
	if (!cycleLevelId) return;
	const level = await db.query.cycleLevels.findFirst({
		where: eq(schema.cycleLevels.id, cycleLevelId),
	});
	if (!level || level.cycleId !== program.cycleId)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "The level does not belong to the cycle of the program",
		});
}

export async function createUnit(
	data: schema.NewTeachingUnit,
	institutionId: string,
) {
	const program = await ensureProgram(data.programId, institutionId);
	await ensureLevel(program, data.cycleLevelId);
	return repo.create(data);
}

export async function updateUnit(
	id: string,
	institutionId: string,
	data: Partial<schema.NewTeachingUnit>,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	const program =
		data.programId && data.programId !== existing.programId
			? await ensureProgram(data.programId, institutionId)
			: await ensureProgram(existing.programId, institutionId);
	await ensureLevel(program, data.cycleLevelId);
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

export async function listUnitsPaged(
	input: { page: number; pageSize: number; programId?: string },
	institutionId: string,
) {
	return repo.listPaged(institutionId, input);
}
