import { and, count, desc, eq, lt } from "drizzle-orm";
import { db } from "../../db";
import type {
	ClassExportTemplate,
	ExportTemplate,
	ExportTemplateType,
	NewClassExportTemplate,
	NewExportTemplate,
	NewProgramExportTemplate,
	ProgramExportTemplate,
} from "../../db/schema/app-schema";
import * as schema from "../../db/schema/app-schema";

// ---------- export_templates ----------

export async function findTemplateById(
	id: string,
): Promise<ExportTemplate | undefined> {
	return await db.query.exportTemplates.findFirst({
		where: eq(schema.exportTemplates.id, id),
	});
}

export async function findTemplateByIdForInstitution(
	id: string,
	institutionId: string,
): Promise<ExportTemplate | undefined> {
	return await db.query.exportTemplates.findFirst({
		where: and(
			eq(schema.exportTemplates.id, id),
			eq(schema.exportTemplates.institutionId, institutionId),
		),
	});
}

export async function findTemplatesByInstitution(
	institutionId: string,
	type?: ExportTemplateType,
	isDefault?: boolean,
	cursor?: string,
	limit?: number,
): Promise<{ items: ExportTemplate[]; nextCursor?: string }> {
	const pageLimit = Math.min(Math.max(limit ?? 50, 1), 100);
	const conditions = [eq(schema.exportTemplates.institutionId, institutionId)];

	if (type) {
		conditions.push(eq(schema.exportTemplates.type, type));
	}

	if (isDefault !== undefined) {
		conditions.push(eq(schema.exportTemplates.isDefault, isDefault));
	}

	if (cursor) {
		conditions.push(lt(schema.exportTemplates.createdAt, new Date(cursor)));
	}

	const items = await db.query.exportTemplates.findMany({
		where: and(...conditions),
		orderBy: [desc(schema.exportTemplates.createdAt)],
		limit: pageLimit,
	});

	const nextCursor =
		items.length === pageLimit
			? items[items.length - 1].createdAt.toISOString()
			: undefined;
	return { items, nextCursor };
}

export async function findDefaultTemplate(
	institutionId: string,
	type: ExportTemplateType,
	variant?: "standard" | "center",
): Promise<ExportTemplate | undefined> {
	const conditions = [
		eq(schema.exportTemplates.institutionId, institutionId),
		eq(schema.exportTemplates.type, type),
		eq(schema.exportTemplates.isDefault, true),
	];
	if (variant) {
		conditions.push(eq(schema.exportTemplates.variant, variant));
	}
	return await db.query.exportTemplates.findFirst({
		where: and(...conditions),
	});
}

export async function findSystemDefaultTemplate(
	institutionId: string,
	type: ExportTemplateType,
	variant?: "standard" | "center",
): Promise<ExportTemplate | undefined> {
	const conditions = [
		eq(schema.exportTemplates.institutionId, institutionId),
		eq(schema.exportTemplates.type, type),
		eq(schema.exportTemplates.isSystemDefault, true),
	];
	if (variant) {
		conditions.push(eq(schema.exportTemplates.variant, variant));
	}
	return await db.query.exportTemplates.findFirst({
		where: and(...conditions),
	});
}

export async function createTemplate(
	template: NewExportTemplate,
): Promise<ExportTemplate> {
	const [created] = await db
		.insert(schema.exportTemplates)
		.values(template)
		.returning();
	return created;
}

export async function updateTemplate(
	id: string,
	institutionId: string,
	updates: Partial<NewExportTemplate>,
): Promise<ExportTemplate | undefined> {
	const [updated] = await db
		.update(schema.exportTemplates)
		.set({ ...updates, updatedAt: new Date() })
		.where(
			and(
				eq(schema.exportTemplates.id, id),
				eq(schema.exportTemplates.institutionId, institutionId),
			),
		)
		.returning();
	return updated;
}

export async function deleteTemplate(
	id: string,
	institutionId: string,
): Promise<boolean> {
	const result = await db
		.delete(schema.exportTemplates)
		.where(
			and(
				eq(schema.exportTemplates.id, id),
				eq(schema.exportTemplates.institutionId, institutionId),
			),
		)
		.returning();
	return result.length > 0;
}

export async function setDefaultTemplate(
	institutionId: string,
	templateId: string,
	type: ExportTemplateType,
): Promise<void> {
	// First, unset all defaults for this type and institution
	await db
		.update(schema.exportTemplates)
		.set({ isDefault: false, updatedAt: new Date() })
		.where(
			and(
				eq(schema.exportTemplates.institutionId, institutionId),
				eq(schema.exportTemplates.type, type),
			),
		);

	if (templateId) {
		// Then set the new default
		await db
			.update(schema.exportTemplates)
			.set({ isDefault: true, updatedAt: new Date() })
			.where(
				and(
					eq(schema.exportTemplates.id, templateId),
					eq(schema.exportTemplates.institutionId, institutionId),
				),
			);
	}
}

export async function findTemplatesByInstitutionPaged(
	institutionId: string,
	opts: { page: number; pageSize: number; type?: ExportTemplateType },
): Promise<{ items: ExportTemplate[]; total: number; pageCount: number }> {
	const size = Math.min(Math.max(opts.pageSize, 1), 100);
	const offset = (Math.max(opts.page, 1) - 1) * size;
	const conditions = [eq(schema.exportTemplates.institutionId, institutionId)];
	if (opts.type) conditions.push(eq(schema.exportTemplates.type, opts.type));
	const where = and(...conditions);

	const [items, [{ total }]] = await Promise.all([
		db.query.exportTemplates.findMany({
			where,
			orderBy: [desc(schema.exportTemplates.createdAt)],
			limit: size,
			offset,
		}),
		db.select({ total: count() }).from(schema.exportTemplates).where(where),
	]);
	const totalCount = Number(total ?? 0);
	return { items, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}

// ---------- class_export_templates ----------

export async function findClassAssignment(
	classId: string,
	type: ExportTemplateType,
): Promise<ClassExportTemplate | undefined> {
	return await db.query.classExportTemplates.findFirst({
		where: and(
			eq(schema.classExportTemplates.classId, classId),
			eq(schema.classExportTemplates.templateType, type),
		),
	});
}

export async function listClassAssignments(
	institutionId: string,
	filters: { classId?: string; templateType?: ExportTemplateType } = {},
): Promise<ClassExportTemplate[]> {
	const conditions = [
		eq(schema.classExportTemplates.institutionId, institutionId),
	];
	if (filters.classId) {
		conditions.push(eq(schema.classExportTemplates.classId, filters.classId));
	}
	if (filters.templateType) {
		conditions.push(
			eq(schema.classExportTemplates.templateType, filters.templateType),
		);
	}
	return await db.query.classExportTemplates.findMany({
		where: and(...conditions),
		orderBy: [desc(schema.classExportTemplates.updatedAt)],
	});
}

export async function upsertClassAssignment(
	row: NewClassExportTemplate,
): Promise<ClassExportTemplate> {
	const [created] = await db
		.insert(schema.classExportTemplates)
		.values(row)
		.onConflictDoUpdate({
			target: [
				schema.classExportTemplates.classId,
				schema.classExportTemplates.templateType,
			],
			set: {
				templateId: row.templateId,
				themeOverrides: row.themeOverrides ?? null,
				updatedAt: new Date(),
				updatedBy: row.updatedBy ?? null,
			},
		})
		.returning();
	return created;
}

export async function findClassAssignmentForInstitution(
	classId: string,
	type: ExportTemplateType,
	institutionId: string,
): Promise<ClassExportTemplate | undefined> {
	return await db.query.classExportTemplates.findFirst({
		where: and(
			eq(schema.classExportTemplates.classId, classId),
			eq(schema.classExportTemplates.templateType, type),
			eq(schema.classExportTemplates.institutionId, institutionId),
		),
	});
}

export async function deleteClassAssignment(
	classId: string,
	type: ExportTemplateType,
	institutionId: string,
): Promise<boolean> {
	const result = await db
		.delete(schema.classExportTemplates)
		.where(
			and(
				eq(schema.classExportTemplates.classId, classId),
				eq(schema.classExportTemplates.templateType, type),
				eq(schema.classExportTemplates.institutionId, institutionId),
			),
		)
		.returning();
	return result.length > 0;
}

// ---------- program_export_templates (theme overrides) ----------

export async function findProgramAssignment(
	programId: string,
	type: ExportTemplateType,
): Promise<ProgramExportTemplate | undefined> {
	return await db.query.programExportTemplates.findFirst({
		where: and(
			eq(schema.programExportTemplates.programId, programId),
			eq(schema.programExportTemplates.templateType, type),
		),
	});
}

export async function upsertProgramAssignment(
	row: NewProgramExportTemplate,
): Promise<ProgramExportTemplate> {
	const [created] = await db
		.insert(schema.programExportTemplates)
		.values(row)
		.onConflictDoUpdate({
			target: [
				schema.programExportTemplates.programId,
				schema.programExportTemplates.templateType,
			],
			set: {
				templateId: row.templateId,
				themeOverrides: row.themeOverrides ?? null,
			},
		})
		.returning();
	return created;
}

export async function deleteProgramAssignment(
	programId: string,
	type: ExportTemplateType,
	institutionId: string,
): Promise<boolean> {
	const result = await db
		.delete(schema.programExportTemplates)
		.where(
			and(
				eq(schema.programExportTemplates.programId, programId),
				eq(schema.programExportTemplates.templateType, type),
				eq(schema.programExportTemplates.institutionId, institutionId),
			),
		)
		.returning();
	return result.length > 0;
}
