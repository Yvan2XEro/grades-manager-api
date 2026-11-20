import type {
	ExportTemplate,
	ExportTemplateType,
} from "../../db/schema/app-schema";
import { notFound } from "../_shared/errors";
import {
	requireClassInInstitution,
	requireProgramInInstitution,
} from "../_shared/tenant-ownership";
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
	ListExportTemplatesPagedInput,
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

export async function listTemplatesPaged(
	institutionId: string,
	input: ListExportTemplatesPagedInput,
) {
	return repo.findTemplatesByInstitutionPaged(institutionId, input);
}

/** A template of the institution; another institution's is NOT_FOUND. */
async function requireTemplate(
	id: string,
	institutionId: string,
): Promise<ExportTemplate> {
	const template = await repo.findTemplateByIdForInstitution(id, institutionId);
	if (!template) throw notFound(`Export template with id ${id} not found`);
	return template;
}

export async function getTemplate(
	input: GetExportTemplateInput,
	institutionId: string,
): Promise<ExportTemplate> {
	return requireTemplate(input.id, institutionId);
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
	institutionId: string,
	userId: string,
	input: UpdateExportTemplateInput,
): Promise<ExportTemplate> {
	const existing = await requireTemplate(input.id, institutionId);

	const updated = await repo.updateTemplate(input.id, institutionId, {
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
	institutionId: string,
): Promise<void> {
	await requireTemplate(input.id, institutionId);
	// System defaults can be deleted — `seedSystemDefaults` is idempotent and
	// will recreate them on demand from the "Initialiser modèles officiels"
	// button.
	const deleted = await repo.deleteTemplate(input.id, institutionId);
	if (!deleted) throw notFound(`Export template with id ${input.id} not found`);
}

export async function setDefault(
	institutionId: string,
	input: SetDefaultTemplateInput,
): Promise<void> {
	const template = await requireTemplate(input.id, institutionId);

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
	const tpl = await requireTemplate(templateId, institutionId);
	if (tpl.type !== type) throw new Error("Template type mismatch");
}

export async function assignClassTemplate(
	institutionId: string,
	userId: string,
	input: AssignClassTemplateInput,
) {
	await requireClassInInstitution(input.classId, institutionId);
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
	await requireClassInInstitution(input.classId, institutionId);
	const existing = await repo.findClassAssignmentForInstitution(
		input.classId,
		input.templateType,
		institutionId,
	);
	if (!existing) {
		throw notFound(
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
	institutionId: string,
) {
	await requireClassInInstitution(input.classId, institutionId);
	return await repo.deleteClassAssignment(
		input.classId,
		input.templateType,
		institutionId,
	);
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
	await requireProgramInInstitution(input.programId, institutionId);
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
	institutionId: string,
) {
	await requireProgramInInstitution(input.programId, institutionId);
	return await repo.deleteProgramAssignment(
		input.programId,
		input.templateType,
		institutionId,
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
