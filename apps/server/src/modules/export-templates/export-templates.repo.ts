import { and, asc, desc, eq, gt } from "drizzle-orm";
import { db } from "../../db";
import type {
	ExportTemplate,
	ExportTemplateType,
	NewExportTemplate,
} from "../../db/schema/app-schema";
import * as schema from "../../db/schema/app-schema";

export async function findTemplateById(
	id: string,
): Promise<ExportTemplate | undefined> {
	return await db.query.exportTemplates.findFirst({
		where: eq(schema.exportTemplates.id, id),
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
		conditions.push(gt(schema.exportTemplates.id, cursor));
	}

	const items = await db.query.exportTemplates.findMany({
		where: and(...conditions),
		orderBy: [asc(schema.exportTemplates.id)],
		limit: pageLimit,
	});

	const nextCursor =
		items.length === pageLimit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function findDefaultTemplate(
	institutionId: string,
	type: ExportTemplateType,
): Promise<ExportTemplate | undefined> {
	return await db.query.exportTemplates.findFirst({
		where: and(
			eq(schema.exportTemplates.institutionId, institutionId),
			eq(schema.exportTemplates.type, type),
			eq(schema.exportTemplates.isDefault, true),
		),
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
	updates: Partial<NewExportTemplate>,
): Promise<ExportTemplate | undefined> {
	const [updated] = await db
		.update(schema.exportTemplates)
		.set({ ...updates, updatedAt: new Date() })
		.where(eq(schema.exportTemplates.id, id))
		.returning();
	return updated;
}

export async function deleteTemplate(id: string): Promise<boolean> {
	const result = await db
		.delete(schema.exportTemplates)
		.where(eq(schema.exportTemplates.id, id))
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

	// Then set the new default
	await db
		.update(schema.exportTemplates)
		.set({ isDefault: true, updatedAt: new Date() })
		.where(eq(schema.exportTemplates.id, templateId));
}
