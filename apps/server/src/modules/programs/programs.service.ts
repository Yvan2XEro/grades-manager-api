import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode, slugify } from "@/lib/strings";
import * as programOptionsRepo from "../program-options/program-options.repo";
import * as repo from "./programs.repo";

type CreateInput = Parameters<typeof repo.create>[0];
type UpdateInput = Parameters<typeof repo.update>[2];
type ListInput = Parameters<typeof repo.list>[1];
type SearchInput = Parameters<typeof repo.search>[0];

export async function createProgram(data: CreateInput, institutionId: string) {
	const slug = slugify(data.name);
	const program = await repo.create({
		...data,
		institutionId,
		code: normalizeCode(data.code),
		slug,
	});
	await programOptionsRepo.create({
		programId: program.id,
		name: "Default option",
		code: "default",
		description: "Auto-generated option",
		institutionId: program.institutionId,
	});
	return program;
}

export async function updateProgram(
	id: string,
	institutionId: string,
	data: UpdateInput,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	const payload = {
		...data,
		slug: data.name ? slugify(data.name) : undefined,
		code: data.code ? normalizeCode(data.code) : undefined,
	};
	return repo.update(id, institutionId, payload);
}

export async function deleteProgram(id: string, institutionId: string) {
	await repo.remove(id, institutionId);
}

export async function listPrograms(opts: ListInput, institutionId: string) {
	return repo.list(institutionId, opts);
}

export async function getProgramById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

export async function getProgramByCode(code: string, institutionId: string) {
	const normalized = normalizeCode(code);
	const item = await repo.findByCode(normalized, institutionId);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

export async function searchPrograms(
	opts: Omit<SearchInput, "institutionId">,
	institutionId: string,
) {
	return repo.search({ ...opts, institutionId });
}

export async function cloneCurriculum(
	targetProgramId: string,
	sourceProgramId: string,
	institutionId: string,
) {
	const target = await repo.findById(targetProgramId, institutionId);
	if (!target)
		throw new TRPCError({ code: "NOT_FOUND", message: "Target program not found" });

	const source = await repo.findById(sourceProgramId, institutionId);
	if (!source)
		throw new TRPCError({ code: "NOT_FOUND", message: "Source program not found" });

	const sourceUnits = await db.query.teachingUnits.findMany({
		where: eq(schema.teachingUnits.programId, sourceProgramId),
	});

	let unitsCreated = 0;
	let coursesCreated = 0;

	for (const unit of sourceUnits) {
		const [newUnit] = await db
			.insert(schema.teachingUnits)
			.values({
				programId: targetProgramId,
				name: unit.name,
				code: unit.code,
				description: unit.description,
				credits: unit.credits,
				semester: unit.semester,
			})
			.onConflictDoNothing()
			.returning();

		if (!newUnit) continue;
		unitsCreated++;

		const sourceCourses = await db.query.courses.findMany({
			where: eq(schema.courses.teachingUnitId, unit.id),
		});

		for (const course of sourceCourses) {
			await db
				.insert(schema.courses)
				.values({
					code: course.code,
					name: course.name,
					hours: course.hours,
					program: targetProgramId,
					teachingUnitId: newUnit.id,
					defaultTeacher: null,
					defaultCoefficient: course.defaultCoefficient,
				})
				.onConflictDoNothing();
			coursesCreated++;
		}
	}

	return { unitsCreated, coursesCreated };
}
