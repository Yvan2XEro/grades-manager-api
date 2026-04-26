import { z } from "zod";
import { exportTemplateTypes } from "../../db/schema/app-schema";

const templateTypeEnum = z.enum(exportTemplateTypes);

// Theme override blob — we don't validate the shape here (it depends on the
// type and on the template's own `themeDefaults`). The exports service applies
// strict Zod validation when resolving the final theme.
const themeOverridesSchema = z.record(z.string(), z.unknown()).optional();

// Create template schema
export const createExportTemplateSchema = z.object({
	name: z.string().min(1, "Template name is required"),
	type: templateTypeEnum,
	isDefault: z.boolean().default(false),
	description: z.string().max(500).optional(),
	templateBody: z.string().min(1).optional(),
	themeDefaults: z.record(z.string(), z.unknown()).optional(),
});

// Update template schema
export const updateExportTemplateSchema = z.object({
	id: z.string(),
	name: z.string().min(1).optional(),
	isDefault: z.boolean().optional(),
	description: z.string().max(500).nullable().optional(),
	templateBody: z.string().optional(),
	themeDefaults: z.record(z.string(), z.unknown()).optional(),
});

// List templates schema
export const listExportTemplatesSchema = z.object({
	type: templateTypeEnum.optional(),
	isDefault: z.boolean().optional(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(100).optional(),
});

// Get template schema
export const getExportTemplateSchema = z.object({
	id: z.string(),
});

// Delete template schema
export const deleteExportTemplateSchema = z.object({
	id: z.string(),
});

// Set default template schema
export const setDefaultTemplateSchema = z.object({
	id: z.string(),
	type: templateTypeEnum,
});

// --- Per-class assignment ---
export const assignClassTemplateSchema = z.object({
	classId: z.string(),
	templateType: templateTypeEnum,
	templateId: z.string(),
	themeOverrides: themeOverridesSchema,
});

export const updateClassTemplateAssignmentSchema = z.object({
	classId: z.string(),
	templateType: templateTypeEnum,
	templateId: z.string().optional(),
	themeOverrides: themeOverridesSchema,
});

export const removeClassTemplateAssignmentSchema = z.object({
	classId: z.string(),
	templateType: templateTypeEnum,
});

export const listClassTemplateAssignmentsSchema = z.object({
	classId: z.string().optional(),
	templateType: templateTypeEnum.optional(),
});

// --- Per-program assignment (existing — extended with theme overrides) ---
export const assignProgramTemplateSchema = z.object({
	programId: z.string(),
	templateType: templateTypeEnum,
	templateId: z.string(),
	themeOverrides: themeOverridesSchema,
});

export const removeProgramTemplateAssignmentSchema = z.object({
	programId: z.string(),
	templateType: templateTypeEnum,
});

// --- Theme presets / defaults discovery ---
export const getThemePresetsSchema = z.object({
	kind: z.enum(["diploma", "transcript", "attestation"]),
});

export type CreateExportTemplateInput = z.infer<
	typeof createExportTemplateSchema
>;
export type UpdateExportTemplateInput = z.infer<
	typeof updateExportTemplateSchema
>;
export type ListExportTemplatesInput = z.infer<
	typeof listExportTemplatesSchema
>;
export type GetExportTemplateInput = z.infer<typeof getExportTemplateSchema>;
export type DeleteExportTemplateInput = z.infer<
	typeof deleteExportTemplateSchema
>;
export type SetDefaultTemplateInput = z.infer<typeof setDefaultTemplateSchema>;
export type AssignClassTemplateInput = z.infer<
	typeof assignClassTemplateSchema
>;
export type UpdateClassTemplateAssignmentInput = z.infer<
	typeof updateClassTemplateAssignmentSchema
>;
export type RemoveClassTemplateAssignmentInput = z.infer<
	typeof removeClassTemplateAssignmentSchema
>;
export type ListClassTemplateAssignmentsInput = z.infer<
	typeof listClassTemplateAssignmentsSchema
>;
export type AssignProgramTemplateInput = z.infer<
	typeof assignProgramTemplateSchema
>;
export type RemoveProgramTemplateAssignmentInput = z.infer<
	typeof removeProgramTemplateAssignmentSchema
>;
export type GetThemePresetsInput = z.infer<typeof getThemePresetsSchema>;
