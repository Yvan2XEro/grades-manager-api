import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode, slugify } from "@/lib/strings";
import * as programOptionsRepo from "../program-options/program-options.repo";
import * as repo from "./programs.repo";

type ExportTemplateAssignment = {
	templateType: schema.ExportTemplateType;
	templateId: string;
};

type CreateInput = Omit<
	Parameters<typeof repo.create>[0],
	"institutionId" | "slug"
> & {
	exportTemplates?: ExportTemplateAssignment[];
};
type UpdateInput = Partial<CreateInput>;
type ListInput = Parameters<typeof repo.list>[1];
type SearchInput = Parameters<typeof repo.search>[0];

function normalizeCenterFields<
	T extends { centerId?: string | null; isCenterProgram?: boolean },
>(data: T): T {
	const next = { ...data };
	if (next.centerId) {
		// If a center is explicitly set, mark the program as a center program.
		next.isCenterProgram = true;
	} else if (next.centerId === null) {
		next.isCenterProgram = false;
	}
	return next;
}

export async function createProgram(data: CreateInput, institutionId: string) {
	const slug = slugify(data.name);
	const { exportTemplates, ...programData } = normalizeCenterFields(data);
	const program = await repo.create({
		...programData,
		institutionId,
		code: normalizeCode(programData.code),
		slug,
	});
	await programOptionsRepo.create({
		programId: program.id,
		name: "Default option",
		code: "default",
		description: "Auto-generated option",
		institutionId: program.institutionId,
	});
	if (exportTemplates?.length) {
		await repo.setExportTemplates(program.id, institutionId, exportTemplates);
	}
	return program;
}

export async function updateProgram(
	id: string,
	institutionId: string,
	data: UpdateInput,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	const { exportTemplates, ...rest } = normalizeCenterFields(data);
	const payload = {
		...rest,
		slug: rest.name ? slugify(rest.name) : undefined,
		code: rest.code ? normalizeCode(rest.code) : undefined,
	};
	const updated = await repo.update(id, institutionId, payload);
	if (exportTemplates) {
		await repo.setExportTemplates(id, institutionId, exportTemplates);
	}
	return updated;
}

export async function setProgramExportTemplates(
	programId: string,
	institutionId: string,
	templates: ExportTemplateAssignment[],
) {
	const existing = await repo.findById(programId, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	return repo.setExportTemplates(programId, institutionId, templates);
}

export async function listProgramExportTemplates(
	programId: string,
	institutionId: string,
) {
	const existing = await repo.findById(programId, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	return repo.listExportTemplates(programId);
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
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Target program not found",
		});

	const source = await repo.findById(sourceProgramId, institutionId);
	if (!source)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Source program not found",
		});

	return cloneCurriculumInternal(sourceProgramId, targetProgramId);
}

async function cloneCurriculumInternal(
	sourceProgramId: string,
	targetProgramId: string,
) {
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

async function buildUniqueCode(
	baseCode: string,
	institutionId: string,
): Promise<string> {
	let candidate = normalizeCode(baseCode);
	let counter = 2;
	while (await repo.findByCode(candidate, institutionId)) {
		candidate = normalizeCode(`${baseCode}-${counter}`);
		counter++;
	}
	return candidate;
}

async function buildUniqueName(
	baseName: string,
	institutionId: string,
): Promise<string> {
	let candidate = baseName;
	let counter = 2;
	const findByName = async (name: string) => {
		const [row] = await db
			.select({ id: schema.programs.id })
			.from(schema.programs)
			.where(
				and(
					eq(schema.programs.institutionId, institutionId),
					eq(schema.programs.name, name),
				),
			)
			.limit(1);
		return row ?? null;
	};
	while (await findByName(candidate)) {
		candidate = `${baseName} (${counter})`;
		counter++;
	}
	return candidate;
}

export async function duplicateForCycles(
	sourceProgramIds: string[],
	targetCycleIds: string[],
	institutionId: string,
	options: { cloneCurriculum?: boolean } = {},
) {
	const cloneCurr = options.cloneCurriculum ?? true;

	const cycles = await db.query.studyCycles.findMany({
		where: and(
			eq(schema.studyCycles.institutionId, institutionId),
			inArray(schema.studyCycles.id, targetCycleIds),
		),
	});
	if (cycles.length !== targetCycleIds.length) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "One or more target cycles not found",
		});
	}

	const sources = await db.query.programs.findMany({
		where: and(
			eq(schema.programs.institutionId, institutionId),
			inArray(schema.programs.id, sourceProgramIds),
		),
	});
	if (sources.length !== sourceProgramIds.length) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "One or more source programs not found",
		});
	}

	const created: Array<{
		id: string;
		name: string;
		code: string;
		cycleId: string;
		sourceProgramId: string;
		unitsCreated: number;
		coursesCreated: number;
	}> = [];
	const skipped: Array<{
		sourceProgramId: string;
		cycleId: string;
		reason: string;
	}> = [];

	for (const cycle of cycles) {
		for (const source of sources) {
			if (source.cycleId && source.cycleId === cycle.id) {
				skipped.push({
					sourceProgramId: source.id,
					cycleId: cycle.id,
					reason: "Source program already on target cycle",
				});
				continue;
			}
			const baseCode = `${source.code}-${cycle.code}`;
			const baseName = `${source.name} (${cycle.name})`;
			const newCode = await buildUniqueCode(baseCode, institutionId);
			const newName = await buildUniqueName(baseName, institutionId);
			const newProgram = await createProgram(
				{
					code: newCode,
					name: newName,
					nameEn: source.nameEn ?? undefined,
					abbreviation: source.abbreviation ?? undefined,
					description: source.description ?? undefined,
					domainFr: source.domainFr ?? undefined,
					domainEn: source.domainEn ?? undefined,
					specialiteFr: source.specialiteFr ?? undefined,
					specialiteEn: source.specialiteEn ?? undefined,
					diplomaTitleFr: source.diplomaTitleFr ?? undefined,
					diplomaTitleEn: source.diplomaTitleEn ?? undefined,
					attestationValidityFr: source.attestationValidityFr ?? undefined,
					attestationValidityEn: source.attestationValidityEn ?? undefined,
					cycleId: cycle.id,
					centerId: source.centerId ?? undefined,
					isCenterProgram: source.isCenterProgram ?? false,
				},
				institutionId,
			);

			let unitsCreated = 0;
			let coursesCreated = 0;
			if (cloneCurr) {
				const result = await cloneCurriculumInternal(source.id, newProgram.id);
				unitsCreated = result.unitsCreated;
				coursesCreated = result.coursesCreated;
			}

			created.push({
				id: newProgram.id,
				name: newProgram.name,
				code: newProgram.code,
				cycleId: cycle.id,
				sourceProgramId: source.id,
				unitsCreated,
				coursesCreated,
			});
		}
	}

	return {
		createdCount: created.length,
		skippedCount: skipped.length,
		created,
		skipped,
	};
}
