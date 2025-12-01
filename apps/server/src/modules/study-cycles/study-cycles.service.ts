import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "./study-cycles.repo";

async function ensureFaculty(facultyId: string) {
	const faculty = await db.query.faculties.findFirst({
		where: eq(schema.faculties.id, facultyId),
	});
	if (!faculty) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Faculty not found" });
	}
}

async function ensureCycle(cycleId: string) {
	const cycle = await repo.findCycleById(cycleId);
	if (!cycle) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Cycle not found" });
	}
	return cycle;
}

async function ensureLevel(levelId: string) {
	const level = await repo.findLevelById(levelId);
	if (!level) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Cycle level not found",
		});
	}
	return level;
}

export async function createCycle(data: schema.NewStudyCycle) {
	await ensureFaculty(data.facultyId);
	return repo.createCycle(data);
}

export async function updateCycle(
	id: string,
	data: Partial<schema.NewStudyCycle>,
) {
	const existing = await ensureCycle(id);
	if (data.facultyId && data.facultyId !== existing.facultyId) {
		await ensureFaculty(data.facultyId);
	}
	return repo.updateCycle(id, data);
}

export async function deleteCycle(id: string) {
	await ensureCycle(id);
	await repo.deleteCycle(id);
}

export async function listCycles(opts: Parameters<typeof repo.listCycles>[0]) {
	return repo.listCycles(opts);
}

export async function getCycleById(id: string) {
	const cycle = await repo.findCycleById(id);
	if (!cycle) throw new TRPCError({ code: "NOT_FOUND" });
	return cycle;
}

export async function createLevel(data: schema.NewCycleLevel) {
	const cycle = await ensureCycle(data.cycleId);
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
	data: Partial<schema.NewCycleLevel>,
) {
	const existing = await ensureLevel(id);
	if (data.cycleId && data.cycleId !== existing.cycleId) {
		await ensureCycle(data.cycleId);
	}
	return repo.updateLevel(id, data);
}

export async function deleteLevel(id: string) {
	await ensureLevel(id);
	await repo.deleteLevel(id);
}

export async function listLevels(cycleId: string) {
	await ensureCycle(cycleId);
	return repo.listLevels(cycleId);
}

export async function getLevelById(id: string) {
	const level = await repo.findLevelById(id);
	if (!level) throw new TRPCError({ code: "NOT_FOUND" });
	return level;
}
