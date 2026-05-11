import { and, count, eq, gt, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

const programSelection = {
	id: schema.programs.id,
	institutionId: schema.programs.institutionId,
	code: schema.programs.code,
	name: schema.programs.name,
	nameEn: schema.programs.nameEn,
	abbreviation: schema.programs.abbreviation,
	description: schema.programs.description,
	domainFr: schema.programs.domainFr,
	domainEn: schema.programs.domainEn,
	specialiteFr: schema.programs.specialiteFr,
	specialiteEn: schema.programs.specialiteEn,
	diplomaTitleFr: schema.programs.diplomaTitleFr,
	diplomaTitleEn: schema.programs.diplomaTitleEn,
	attestationValidityFr: schema.programs.attestationValidityFr,
	attestationValidityEn: schema.programs.attestationValidityEn,
	cycleId: schema.programs.cycleId,
	centerId: schema.programs.centerId,
	isCenterProgram: schema.programs.isCenterProgram,
	createdAt: schema.programs.createdAt,
};

export async function create(data: schema.NewProgram) {
	const [item] = await db.insert(schema.programs).values(data).returning();
	return item;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewProgram>,
) {
	const [item] = await db
		.update(schema.programs)
		.set(data)
		.where(
			and(
				eq(schema.programs.id, id),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.programs)
		.where(
			and(
				eq(schema.programs.id, id),
				eq(schema.programs.institutionId, institutionId),
			),
		);
}

export async function findById(id: string, institutionId: string) {
	const [program] = await db
		.select(programSelection)
		.from(schema.programs)
		.where(
			and(
				eq(schema.programs.id, id),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.limit(1);
	return program ?? null;
}

export async function findByCode(code: string, institutionId: string) {
	const [program] = await db
		.select(programSelection)
		.from(schema.programs)
		.where(
			and(
				eq(schema.programs.code, code),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.limit(1);
	return program ?? null;
}

export async function list(
	institutionId: string,
	opts: {
		q?: string;
		cursor?: string;
		limit?: number;
		centerId?: string;
		isCenterProgram?: boolean;
	},
) {
	const limit = opts.limit ?? 50;
	let condition:
		| ReturnType<typeof eq>
		| ReturnType<typeof and>
		| ReturnType<typeof gt>
		| undefined = eq(schema.programs.institutionId, institutionId);
	if (opts.q) {
		const qCond = ilike(schema.programs.name, `%${opts.q}%`);
		condition = condition ? and(condition, qCond) : qCond;
	}
	if (opts.centerId) {
		const cCond = eq(schema.programs.centerId, opts.centerId);
		condition = condition ? and(condition, cCond) : cCond;
	}
	if (opts.isCenterProgram !== undefined) {
		const ipCond = eq(schema.programs.isCenterProgram, opts.isCenterProgram);
		condition = condition ? and(condition, ipCond) : ipCond;
	}
	if (opts.cursor) {
		const cursorCond = gt(schema.programs.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	const rows = await db
		.select({
			...programSelection,
			optionsCount: count(schema.programOptions.id),
		})
		.from(schema.programs)
		.leftJoin(
			schema.programOptions,
			eq(schema.programOptions.programId, schema.programs.id),
		)
		.where(condition)
		.groupBy(
			schema.programs.id,
			schema.programs.institutionId,
			schema.programs.code,
			schema.programs.name,
			schema.programs.nameEn,
			schema.programs.abbreviation,
			schema.programs.description,
			schema.programs.domainFr,
			schema.programs.domainEn,
			schema.programs.specialiteFr,
			schema.programs.specialiteEn,
			schema.programs.diplomaTitleFr,
			schema.programs.diplomaTitleEn,
			schema.programs.attestationValidityFr,
			schema.programs.attestationValidityEn,
			schema.programs.cycleId,
			schema.programs.centerId,
			schema.programs.isCenterProgram,
			schema.programs.createdAt,
		)
		.orderBy(schema.programs.name)
		.limit(limit);
	const items = rows.map((r) => ({
		id: r.id,
		institutionId: r.institutionId,
		code: r.code,
		name: r.name,
		nameEn: r.nameEn,
		abbreviation: r.abbreviation,
		description: r.description,
		domainFr: r.domainFr,
		domainEn: r.domainEn,
		specialiteFr: r.specialiteFr,
		specialiteEn: r.specialiteEn,
		diplomaTitleFr: r.diplomaTitleFr,
		diplomaTitleEn: r.diplomaTitleEn,
		attestationValidityFr: r.attestationValidityFr,
		attestationValidityEn: r.attestationValidityEn,
		cycleId: r.cycleId,
		centerId: r.centerId,
		isCenterProgram: r.isCenterProgram,
		createdAt: r.createdAt,
		optionsCount: r.optionsCount,
	}));
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function search(opts: {
	query: string;
	limit?: number;
	institutionId: string;
}) {
	const limit = opts.limit ?? 20;
	const searchCondition = or(
		ilike(schema.programs.code, `%${opts.query}%`),
		ilike(schema.programs.name, `%${opts.query}%`),
	);
	const condition = and(
		eq(schema.programs.institutionId, opts.institutionId),
		searchCondition,
	);

	const items = await db
		.select(programSelection)
		.from(schema.programs)
		.where(condition)
		.orderBy(schema.programs.code)
		.limit(limit);
	return items;
}

export async function listExportTemplates(programId: string) {
	return db
		.select({
			id: schema.programExportTemplates.id,
			templateType: schema.programExportTemplates.templateType,
			templateId: schema.programExportTemplates.templateId,
			templateName: schema.exportTemplates.name,
		})
		.from(schema.programExportTemplates)
		.innerJoin(
			schema.exportTemplates,
			eq(schema.exportTemplates.id, schema.programExportTemplates.templateId),
		)
		.where(eq(schema.programExportTemplates.programId, programId));
}

export async function setExportTemplates(
	programId: string,
	institutionId: string,
	assignments: Array<{
		templateType: schema.ExportTemplateType;
		templateId: string;
	}>,
) {
	await db
		.delete(schema.programExportTemplates)
		.where(eq(schema.programExportTemplates.programId, programId));
	if (!assignments.length) return [];
	const rows = assignments.map((a) => ({
		programId,
		institutionId,
		templateType: a.templateType,
		templateId: a.templateId,
	}));
	return db.insert(schema.programExportTemplates).values(rows).returning();
}

export async function findDefaultExportTemplate(
	programId: string,
	templateType: schema.ExportTemplateType,
) {
	const [row] = await db
		.select({
			templateId: schema.programExportTemplates.templateId,
		})
		.from(schema.programExportTemplates)
		.where(
			and(
				eq(schema.programExportTemplates.programId, programId),
				eq(schema.programExportTemplates.templateType, templateType),
			),
		)
		.limit(1);
	return row?.templateId ?? null;
}
