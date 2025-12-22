import { z } from "zod";
import type { ExportTemplateType } from "../../db/schema/app-schema";

// Create template schema
export const createExportTemplateSchema = z.object({
	name: z.string().min(1, "Template name is required"),
	type: z.enum(["pv", "evaluation", "ue"]),
	isDefault: z.boolean().default(false),
	templateBody: z.string().min(1).optional(),
});

// Update template schema
export const updateExportTemplateSchema = z.object({
	id: z.string(),
	name: z.string().min(1).optional(),
	isDefault: z.boolean().optional(),
	templateBody: z.string().optional(),
});

// List templates schema
export const listExportTemplatesSchema = z.object({
	type: z.enum(["pv", "evaluation", "ue"]).optional(),
	isDefault: z.boolean().optional(),
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
	type: z.enum(["pv", "evaluation", "ue"]),
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
