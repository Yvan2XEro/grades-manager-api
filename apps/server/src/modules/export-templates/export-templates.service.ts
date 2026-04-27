import type {
	ExportTemplate,
	ExportTemplateType,
} from "../../db/schema/app-schema";
import { loadTemplate } from "../exports/template-helper";
import {
	getDefaultTheme,
	isDocumentThemeKind,
	type ThemeKind,
} from "../exports/themes";
import { getDefaultThemePayload } from "../exports/themes/presets-payload";
import * as repo from "./export-templates.repo";
import type {
	AssignClassTemplateInput,
	AssignProgramTemplateInput,
	CreateExportTemplateInput,
	DeleteExportTemplateInput,
	GetExportTemplateInput,
	ListExportTemplatesInput,
	RemoveClassTemplateAssignmentInput,
	RemoveProgramTemplateAssignmentInput,
	SetDefaultTemplateInput,
	UpdateClassTemplateAssignmentInput,
	UpdateExportTemplateInput,
} from "./export-templates.zod";

export async function listTemplates(
	institutionId: string,
	input: ListExportTemplatesInput,
) {
	return await repo.findTemplatesByInstitution(
		institutionId,
		input.type,
		input.isDefault,
		input.cursor,
		input.limit,
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
	variant?: "standard" | "center",
): Promise<ExportTemplate | undefined> {
	// When `variant` is set, ONLY return a default matching that exact variant.
	// Returning a mismatched default (e.g. a "standard" template for a center
	// class) would silently pick the wrong layout. If nothing matches, return
	// undefined so the caller falls through to the bundled HTML, which is
	// variant-aware (`templates/*-center.html` vs the standard one).
	return await repo.findDefaultTemplate(institutionId, type, variant);
}

export async function createTemplate(
	institutionId: string,
	userId: string,
	input: CreateExportTemplateInput,
): Promise<ExportTemplate> {
	if (input.isDefault) {
		await repo.setDefaultTemplate(institutionId, "", input.type);
	}

	const templateBody =
		input.templateBody?.trim() && input.templateBody.length > 0
			? input.templateBody
			: loadTemplate(input.type);

	const themeDefaults = input.themeDefaults
		? input.themeDefaults
		: isDocumentThemeKind(input.type)
			? getDefaultThemePayload(input.type as ThemeKind)
			: {};

	return await repo.createTemplate({
		institutionId,
		name: input.name,
		type: input.type,
		variant: input.variant ?? "standard",
		isDefault: input.isDefault,
		description: input.description ?? null,
		templateBody,
		themeDefaults,
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
		...(input.variant && { variant: input.variant }),
		...(input.isDefault !== undefined && { isDefault: input.isDefault }),
		...(input.description !== undefined && {
			description: input.description ?? null,
		}),
		...(input.templateBody !== undefined && {
			templateBody: input.templateBody,
		}),
		...(input.themeDefaults !== undefined && {
			themeDefaults: input.themeDefaults,
		}),
		updatedBy: userId,
	});

	if (!updated) {
		throw new Error(`Failed to update template ${input.id}`);
	}

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
	const existing = await repo.findTemplateById(input.id);
	if (!existing) {
		throw new Error(`Export template with id ${input.id} not found`);
	}
	// System defaults can be deleted — `seedSystemDefaults` is idempotent and
	// will recreate them on demand from the "Initialiser modèles officiels"
	// button.
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

// ---------- Class assignments ----------

async function assertOwnership(
	institutionId: string,
	templateId: string,
	type: ExportTemplateType,
) {
	const tpl = await repo.findTemplateById(templateId);
	if (!tpl) throw new Error(`Template ${templateId} not found`);
	if (tpl.institutionId !== institutionId)
		throw new Error("Template does not belong to this institution");
	if (tpl.type !== type) throw new Error("Template type mismatch");
}

export async function assignClassTemplate(
	institutionId: string,
	userId: string,
	input: AssignClassTemplateInput,
) {
	await assertOwnership(institutionId, input.templateId, input.templateType);
	return await repo.upsertClassAssignment({
		institutionId,
		classId: input.classId,
		templateType: input.templateType,
		templateId: input.templateId,
		themeOverrides: input.themeOverrides ?? null,
		createdBy: userId,
		updatedBy: userId,
	});
}

export async function updateClassTemplateAssignment(
	institutionId: string,
	userId: string,
	input: UpdateClassTemplateAssignmentInput,
) {
	const existing = await repo.findClassAssignment(
		input.classId,
		input.templateType,
	);
	if (!existing) {
		throw new Error(
			`No assignment exists for class ${input.classId} / ${input.templateType}`,
		);
	}
	const templateId = input.templateId ?? existing.templateId;
	await assertOwnership(institutionId, templateId, input.templateType);
	return await repo.upsertClassAssignment({
		institutionId,
		classId: input.classId,
		templateType: input.templateType,
		templateId,
		themeOverrides:
			input.themeOverrides === undefined
				? (existing.themeOverrides ?? null)
				: (input.themeOverrides ?? null),
		createdBy: existing.createdBy,
		updatedBy: userId,
	});
}

export async function removeClassTemplateAssignment(
	input: RemoveClassTemplateAssignmentInput,
) {
	return await repo.deleteClassAssignment(input.classId, input.templateType);
}

export async function listClassAssignments(
	institutionId: string,
	filters: { classId?: string; templateType?: ExportTemplateType },
) {
	return await repo.listClassAssignments(institutionId, filters);
}

// ---------- Program assignments ----------

export async function assignProgramTemplate(
	institutionId: string,
	input: AssignProgramTemplateInput,
) {
	await assertOwnership(institutionId, input.templateId, input.templateType);
	return await repo.upsertProgramAssignment({
		institutionId,
		programId: input.programId,
		templateType: input.templateType,
		templateId: input.templateId,
		themeOverrides: input.themeOverrides ?? null,
	});
}

export async function removeProgramTemplateAssignment(
	input: RemoveProgramTemplateAssignmentInput,
) {
	return await repo.deleteProgramAssignment(
		input.programId,
		input.templateType,
	);
}

// ---------- Theme presets / defaults ----------

export function listThemePresets(kind: ThemeKind) {
	return {
		kind,
		default: getDefaultTheme(kind),
		// presets are populated lazily by the router using getPresetDescriptors
	};
}
