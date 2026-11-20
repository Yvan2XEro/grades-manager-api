import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode } from "@/lib/strings";
import { conflict, notFound } from "../_shared/errors";
import * as repo from "./cycle-levels.repo";

/*
 * Cycle levels belong to an institution through their study cycle: every
 * operation checks that the cycle is the caller's institution's.
 */

async function institutionCycleIds(institutionId: string) {
	const cycles = await db.query.studyCycles.findMany({
		where: eq(schema.studyCycles.institutionId, institutionId),
		columns: { id: true },
	});
	return cycles.map((c) => c.id);
}

async function requireCycle(cycleId: string, institutionId: string) {
	const cycle = await db.query.studyCycles.findFirst({
		where: eq(schema.studyCycles.id, cycleId),
		columns: { institutionId: true },
	});
	if (!cycle || cycle.institutionId !== institutionId) {
		throw notFound("Study cycle not found");
	}
}

async function requireLevel(id: string, institutionId: string) {
	const level = await repo.findById(id);
	if (!level) throw notFound();
	await requireCycle(level.cycleId, institutionId).catch(() => {
		throw notFound();
	});
	return level;
}

export async function createCycleLevel(
	data: Parameters<typeof repo.create>[0],
	institutionId: string,
) {
	await requireCycle(data.cycleId, institutionId);
	return repo.create({ ...data, code: normalizeCode(data.code) });
}

export async function updateCycleLevel(
	id: string,
	data: Parameters<typeof repo.update>[1],
	institutionId: string,
) {
	await requireLevel(id, institutionId);
	if (data.cycleId) await requireCycle(data.cycleId, institutionId);
	return repo.update(id, {
		...data,
		code: data.code ? normalizeCode(data.code) : undefined,
	});
}

export async function deleteCycleLevel(id: string, institutionId: string) {
	await requireLevel(id, institutionId);
	const classCount = await repo.countClasses(id);
	if (classCount > 0) {
		throw conflict(
			"Cannot delete cycle level: classes are attached to it. Remove them first.",
		);
	}
	await repo.remove(id);
}

export async function listCycleLevels(
	opts: Omit<Parameters<typeof repo.list>[0], "cycleIds">,
	institutionId: string,
) {
	return repo.list({
		...opts,
		cycleIds: await institutionCycleIds(institutionId),
	});
}

export async function getCycleLevelById(id: string, institutionId: string) {
	return requireLevel(id, institutionId);
}

export async function getCycleLevelByCode(
	code: string,
	cycleId: string,
	institutionId: string,
) {
	await requireCycle(cycleId, institutionId).catch(() => {
		throw notFound();
	});
	const item = await repo.findByCode(normalizeCode(code), cycleId);
	if (!item) throw notFound();
	return item;
}

export async function searchCycleLevels(
	opts: Omit<Parameters<typeof repo.search>[0], "cycleIds">,
	institutionId: string,
) {
	return repo.search({
		...opts,
		cycleIds: await institutionCycleIds(institutionId),
	});
}
