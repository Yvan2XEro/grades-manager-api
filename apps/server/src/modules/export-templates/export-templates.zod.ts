import { z } from "zod";
import type { ExportTemplateType } from "../../db/schema/app-schema";

// Column configuration schema
export const exportColumnConfigSchema = z.object({
	id: z.string(),
	key: z.string(),
	label: z.string(),
	labelFr: z.string().optional(),
	labelEn: z.string().optional(),
	width: z.number().optional(),
	visible: z.boolean(),
	order: z.number().int(),
	dataType: z.enum(["text", "number", "date", "formula"]).optional(),
	formula: z.string().optional(),
	format: z.string().optional(),
	alignment: z.enum(["left", "center", "right"]).optional(),
});

// Header configuration schema
export const exportHeaderConfigSchema = z.object({
	showLogo: z.boolean().optional(),
	logoPosition: z.enum(["left", "center", "right"]).optional(),
	title: z.string().optional(),
	titleFr: z.string().optional(),
	titleEn: z.string().optional(),
	subtitle: z.string().optional(),
	subtitleFr: z.string().optional(),
	subtitleEn: z.string().optional(),
	showInstitutionName: z.boolean().optional(),
	showFacultyName: z.boolean().optional(),
	showAcademicYear: z.boolean().optional(),
	showSemester: z.boolean().optional(),
	showClassName: z.boolean().optional(),
	customFields: z
		.array(
			z.object({
				key: z.string(),
				label: z.string(),
				labelFr: z.string().optional(),
				labelEn: z.string().optional(),
				value: z.string().optional(),
				visible: z.boolean(),
				order: z.number().int(),
			}),
		)
		.optional(),
});

// Style configuration schema
export const exportStyleConfigSchema = z.object({
	fontFamily: z.string().optional(),
	fontSize: z.number().optional(),
	headerFontSize: z.number().optional(),
	primaryColor: z.string().optional(),
	secondaryColor: z.string().optional(),
	headerBackgroundColor: z.string().optional(),
	headerTextColor: z.string().optional(),
	tableBorderColor: z.string().optional(),
	tableBorderWidth: z.number().optional(),
	alternateRowColor: z.string().optional(),
	pageSize: z.enum(["A4", "A3", "Letter"]).optional(),
	pageOrientation: z.enum(["portrait", "landscape"]).optional(),
	margins: z
		.object({
			top: z.number(),
			right: z.number(),
			bottom: z.number(),
			left: z.number(),
		})
		.optional(),
	watermark: z
		.object({
			enabled: z.boolean(),
			text: z.string(),
			opacity: z.number().optional(),
			fontSize: z.number().optional(),
			rotation: z.number().optional(),
		})
		.optional(),
});

// Create template schema
export const createExportTemplateSchema = z.object({
	name: z.string().min(1, "Template name is required"),
	type: z.enum([
		"pv",
		"evaluation",
		"ue",
		"excel_combined",
		"excel_pv",
		"excel_individual",
	]),
	isDefault: z.boolean().default(false),
	columns: z.array(exportColumnConfigSchema),
	headerConfig: exportHeaderConfigSchema.optional(),
	styleConfig: exportStyleConfigSchema.optional(),
	customTemplate: z.string().optional(),
});

// Update template schema
export const updateExportTemplateSchema = z.object({
	id: z.string(),
	name: z.string().min(1).optional(),
	isDefault: z.boolean().optional(),
	columns: z.array(exportColumnConfigSchema).optional(),
	headerConfig: exportHeaderConfigSchema.optional(),
	styleConfig: exportStyleConfigSchema.optional(),
	customTemplate: z.string().optional(),
});

// List templates schema
export const listExportTemplatesSchema = z.object({
	type: z
		.enum([
			"pv",
			"evaluation",
			"ue",
			"excel_combined",
			"excel_pv",
			"excel_individual",
		])
		.optional(),
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
	type: z.enum([
		"pv",
		"evaluation",
		"ue",
		"excel_combined",
		"excel_pv",
		"excel_individual",
	]),
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
