import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import * as repo from "./study-cycles.repo";

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

/** Default level prefix of a cycle: its first letter (Licence → L, Master → M). */
export function defaultLevelPrefix(cycleName: string) {
	const letter = cycleName
		.normalize("NFD")
		.replace(/[^A-Za-z]/g, "")
		.charAt(0);
	return (letter || "N").toUpperCase();
}

/**
 * Levels generated with a new cycle, one per year: "Licence 1" (L1),
 * "Licence 2" (L2)… named after the cycle so they read the same in French
 * and English and stay distinct from one cycle to the next.
 */
export function generatedLevels(args: {
	name: string;
	durationYears: number;
	totalCreditsRequired?: number | null;
	levelPrefix?: string | null;
}) {
	const prefix =
		args.levelPrefix?.trim().toUpperCase() || defaultLevelPrefix(args.name);
	const minCredits = Math.floor(
		(args.totalCreditsRequired ?? 180) / args.durationYears,
	);
	return Array.from({ length: args.durationYears }, (_, i) => ({
		orderIndex: i + 1,
		code: `${prefix}${i + 1}`,
		name: `${args.name.trim()} ${i + 1}`,
		minCredits,
	}));
}

export async function createCycle(
	input: Omit<schema.NewStudyCycle, "institutionId"> & {
		levelPrefix?: string;
	},
	institutionId: string,
) {
	const { levelPrefix, ...data } = input;
	// Auto-inject institutionId from context if not provided
	const cycle = await repo.createCycle({ ...data, institutionId });

	// Auto-create cycle levels based on durationYears
	if (data.durationYears && data.durationYears > 0) {
		for (const level of generatedLevels({
			name: data.name,
			durationYears: data.durationYears,
			totalCreditsRequired: data.totalCreditsRequired,
			levelPrefix,
		})) {
			await repo.createLevel({ cycleId: cycle.id, ...level });
		}
	}

	return cycle;
}

export async function updateCycle(
	id: string,
	institutionId: string,
	data: Partial<schema.NewStudyCycle>,
) {
	await ensureCycle(id, institutionId);
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
	data: Omit<schema.NewCycleLevel, "orderIndex"> & {
		orderIndex?: number;
	},
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

export async function listCyclesPaged(
	input: { page: number; pageSize: number },
	institutionId: string,
) {
	return repo.listCyclesPaged(institutionId, input);
}
