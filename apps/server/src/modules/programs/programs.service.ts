import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "./programs.repo";

async function ensureCycleLevelExists(cycleId: string) {
	const level = await db.query.cycleLevels.findFirst({
		where: eq(schema.cycleLevels.cycleId, cycleId),
		orderBy: (levels, { asc }) => asc(levels.orderIndex),
	});
	if (level) return level.id;
	const [created] = await db
		.insert(schema.cycleLevels)
		.values({
			cycleId,
			orderIndex: 1,
			code: "L1",
			name: "Level 1",
			minCredits: 60,
		})
		.returning();
	return created.id;
}

async function ensureCycleForFaculty(facultyId: string, cycleId?: string) {
	if (cycleId) {
		const cycle = await db.query.studyCycles.findFirst({
			where: eq(schema.studyCycles.id, cycleId),
		});
		if (!cycle) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Study cycle not found",
			});
		}
		if (cycle.facultyId !== facultyId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Cycle does not belong to the faculty",
			});
		}
		await ensureCycleLevelExists(cycle.id);
		return cycle.id;
	}
	const existing = await db.query.studyCycles.findFirst({
		where: eq(schema.studyCycles.facultyId, facultyId),
	});
	if (existing) {
		await ensureCycleLevelExists(existing.id);
		return existing.id;
	}
	const [created] = await db
		.insert(schema.studyCycles)
		.values({
			facultyId,
			code: "default",
			name: "Default Cycle",
			description: null,
			totalCreditsRequired: 180,
			durationYears: 3,
		})
		.returning();
	await ensureCycleLevelExists(created.id);
	return created.id;
}

export async function createProgram(data: Parameters<typeof repo.create>[0]) {
	const cycleId = await ensureCycleForFaculty(data.faculty, data.cycleId);
	return repo.create({ ...data, cycleId });
}

export async function updateProgram(
	id: string,
	data: Parameters<typeof repo.update>[1],
) {
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	const facultyId = data.faculty ?? existing.faculty;
	let cycleId = existing.cycleId;
	if (data.cycleId !== undefined || data.faculty !== undefined) {
		cycleId = await ensureCycleForFaculty(
			facultyId,
			data.cycleId ?? existing.cycleId,
		);
	}
	return repo.update(id, { ...data, faculty: facultyId, cycleId });
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
