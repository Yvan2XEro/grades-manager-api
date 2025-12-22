import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import type {
	ExportTemplate,
	ExportTemplateType,
	NewExportTemplate,
} from "../../db/schema/app-schema";

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
): Promise<ExportTemplate[]> {
	const conditions = [
		eq(schema.exportTemplates.institutionId, institutionId),
	];

	if (type) {
		conditions.push(eq(schema.exportTemplates.type, type));
	}

	if (isDefault !== undefined) {
		conditions.push(eq(schema.exportTemplates.isDefault, isDefault));
	}

	return await db.query.exportTemplates.findMany({
		where: and(...conditions),
		orderBy: [desc(schema.exportTemplates.createdAt)],
	});
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

export async function deleteTemplate(
	id: string,
): Promise<boolean> {
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
