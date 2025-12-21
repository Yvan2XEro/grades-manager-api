import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "./study-cycles.repo";

async function ensureFaculty(facultyId: string, institutionId: string) {
	const faculty = await db.query.faculties.findFirst({
		where: and(
			eq(schema.faculties.id, facultyId),
			eq(schema.faculties.institutionId, institutionId),
		),
	});
	if (!faculty) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Faculty not found" });
	}
	return faculty;
}

async function ensureCycle(cycleId: string, institutionId: string) {
	const cycle = await repo.findCycleById(cycleId, institutionId);
	if (!cycle) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Cycle not found" });
	}
	return cycle;
}

async function ensureLevel(levelId: string, institutionId: string) {
	const level = await repo.findLevelById(levelId, institutionId);
	if (!level) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Cycle level not found",
		});
	}
	return level;
}

export async function createCycle(
	data: schema.NewStudyCycle,
	institutionId: string,
) {
	await ensureFaculty(data.facultyId, institutionId);
	return repo.createCycle(data);
}

export async function updateCycle(
	id: string,
	institutionId: string,
	data: Partial<schema.NewStudyCycle>,
) {
	const existing = await ensureCycle(id, institutionId);
	if (data.facultyId && data.facultyId !== existing.facultyId) {
		await ensureFaculty(data.facultyId, institutionId);
	}
	return repo.updateCycle(id, institutionId, data);
}

export async function deleteCycle(id: string, institutionId: string) {
	await ensureCycle(id, institutionId);
	await repo.deleteCycle(id, institutionId);
}

export async function listCycles(
	opts: Parameters<typeof repo.listCycles>[1],
	institutionId: string,
) {
	return repo.listCycles(institutionId, opts);
}

export async function getCycleById(id: string, institutionId: string) {
	const cycle = await repo.findCycleById(id, institutionId);
	if (!cycle) throw new TRPCError({ code: "NOT_FOUND" });
	return cycle;
}

export async function createLevel(
	data: schema.NewCycleLevel,
	institutionId: string,
) {
	const cycle = await ensureCycle(data.cycleId, institutionId);
	const [last] = await db
		.select({ value: schema.cycleLevels.orderIndex })
		.from(schema.cycleLevels)
		.where(eq(schema.cycleLevels.cycleId, cycle.id))
		.orderBy(desc(schema.cycleLevels.orderIndex))
		.limit(1);
	const nextOrder = (last?.value ?? 0) + 1;
	const orderIndex = data.orderIndex ?? nextOrder;
	return repo.createLevel({ ...data, orderIndex });
}

export async function updateLevel(
	id: string,
	institutionId: string,
	data: Partial<schema.NewCycleLevel>,
) {
	const existing = await ensureLevel(id, institutionId);
	if (data.cycleId && data.cycleId !== existing.cycleId) {
		await ensureCycle(data.cycleId, institutionId);
	}
	return repo.updateLevel(id, institutionId, data);
}

export async function deleteLevel(id: string, institutionId: string) {
	await ensureLevel(id, institutionId);
	await repo.deleteLevel(id, institutionId);
}

export async function listLevels(cycleId: string, institutionId: string) {
	await ensureCycle(cycleId, institutionId);
	return repo.listLevels(cycleId, institutionId);
}

export async function getLevelById(id: string, institutionId: string) {
	const level = await repo.findLevelById(id, institutionId);
	if (!level) throw new TRPCError({ code: "NOT_FOUND" });
	return level;
}
