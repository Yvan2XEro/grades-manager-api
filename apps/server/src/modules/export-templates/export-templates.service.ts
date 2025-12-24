import type {
	ExportTemplate,
	ExportTemplateType,
} from "../../db/schema/app-schema";
import type {
	CreateExportTemplateInput,
	DeleteExportTemplateInput,
	GetExportTemplateInput,
	ListExportTemplatesInput,
	SetDefaultTemplateInput,
	UpdateExportTemplateInput,
} from "./export-templates.zod";
import * as repo from "./export-templates.repo";
import { loadTemplate } from "../exports/template-helper";

export async function listTemplates(
	institutionId: string,
	input: ListExportTemplatesInput,
): Promise<ExportTemplate[]> {
	return await repo.findTemplatesByInstitution(
		institutionId,
		input.type,
		input.isDefault,
	);
}

export async function getTemplate(
	input: GetExportTemplateInput,
): Promise<ExportTemplate> {
	const template = await repo.findTemplateById(input.id);
	if (!template) {
		throw new Error(`Export template with id ${input.id} not found`);
	}
	return template;
}

export async function getDefaultTemplate(
	institutionId: string,
	type: ExportTemplateType,
): Promise<ExportTemplate | undefined> {
	return await repo.findDefaultTemplate(institutionId, type);
}

export async function createTemplate(
	institutionId: string,
	userId: string,
	input: CreateExportTemplateInput,
): Promise<ExportTemplate> {
	// If this is set as default, unset other defaults first
	if (input.isDefault) {
		await repo.setDefaultTemplate(institutionId, "", input.type);
	}

	const templateBody =
		input.templateBody ?? loadTemplate(input.type as "pv" | "evaluation" | "ue");

	return await repo.createTemplate({
		institutionId,
		name: input.name,
		type: input.type,
		isDefault: input.isDefault,
		templateBody,
		createdBy: userId,
		updatedBy: userId,
	});
}

export async function updateTemplate(
	userId: string,
	input: UpdateExportTemplateInput,
): Promise<ExportTemplate> {
	const existing = await repo.findTemplateById(input.id);
	if (!existing) {
		throw new Error(`Export template with id ${input.id} not found`);
	}

	const updated = await repo.updateTemplate(input.id, {
		...(input.name && { name: input.name }),
		...(input.isDefault !== undefined && { isDefault: input.isDefault }),
		...(input.templateBody !== undefined && {
			templateBody: input.templateBody,
		}),
		updatedBy: userId,
	});

	if (!updated) {
		throw new Error(`Failed to update template ${input.id}`);
	}

	// If isDefault was set to true, unset other defaults
	if (input.isDefault === true) {
		await repo.setDefaultTemplate(
			existing.institutionId,
			input.id,
			existing.type,
		);
	}

	return updated;
}

export async function deleteTemplate(
	input: DeleteExportTemplateInput,
): Promise<void> {
	const deleted = await repo.deleteTemplate(input.id);
	if (!deleted) {
		throw new Error(`Export template with id ${input.id} not found`);
	}
}

export async function setDefault(
	institutionId: string,
	input: SetDefaultTemplateInput,
): Promise<void> {
	const template = await repo.findTemplateById(input.id);
	if (!template) {
		throw new Error(`Export template with id ${input.id} not found`);
	}

	if (template.institutionId !== institutionId) {
		throw new Error("Template does not belong to this institution");
	}

	if (template.type !== input.type) {
		throw new Error("Template type mismatch");
	}

	await repo.setDefaultTemplate(institutionId, input.id, input.type);
}
