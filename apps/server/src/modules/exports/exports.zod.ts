import { z } from "zod";

/**
 * Export types supported by the system
 */
export const exportTypeSchema = z.enum([
	"pv", // Semester minutes export
	"evaluation", // Single evaluation publication
	"ue", // Teaching Unit (UE) results
]);

export type ExportType = z.infer<typeof exportTypeSchema>;

/**
 * Output format for exports
 */
export const exportFormatSchema = z.enum(["pdf", "html"]);

export type ExportFormat = z.infer<typeof exportFormatSchema>;

/** Input schema for generating the PV (official minutes) export */
export const generatePVSchema = z.object({
	classId: z.string(),
	semesterId: z.string(),
	academicYearId: z.string(),
	format: exportFormatSchema.default("pdf"),
	templateId: z.string().optional(), // Use specific template instead of default
});

export type GeneratePVInput = z.infer<typeof generatePVSchema>;

/**
 * Input schema for generating an evaluation publication
 */
export const generateEvaluationSchema = z.object({
	examId: z.string(),
	format: exportFormatSchema.default("pdf"),
	observations: z.string().optional(),
	templateId: z.string().optional(), // Use specific template instead of default
});

export type GenerateEvaluationInput = z.infer<typeof generateEvaluationSchema>;

/**
 * Input schema for generating a UE publication
 */
export const generateUESchema = z.object({
	teachingUnitId: z.string(),
	classId: z.string(),
	semesterId: z.string(),
	academicYearId: z.string(),
	format: exportFormatSchema.default("pdf"),
	templateId: z.string().optional(), // Use specific template instead of default
});

export type GenerateUEInput = z.infer<typeof generateUESchema>;

/**
 * Preview schema - same as generation but always returns HTML
 */
export const previewPVSchema = generatePVSchema.omit({ format: true });
export const previewEvaluationSchema = generateEvaluationSchema.omit({
	format: true,
});
export const previewUESchema = generateUESchema.omit({ format: true });

export const previewTemplateSourceSchema = z.object({
	type: exportTypeSchema,
	templateBody: z.string().min(1),
});

export type PreviewTemplateSourceInput = z.infer<
	typeof previewTemplateSourceSchema
>;
