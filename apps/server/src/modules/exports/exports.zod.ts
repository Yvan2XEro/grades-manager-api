import { z } from "zod";

/**
 * Export types supported by the system
 */
export const exportTypeSchema = z.enum([
	"pv", // Semester minutes export
	"evaluation", // Single evaluation publication
	"ec", // EC (Élément Constitutif / class_course) aggregated results
	"ue", // Teaching Unit (UE) results
	"deliberation", // Deliberation report
	"diploma", // Student diploma (delegated to academic-documents service)
	"transcript", // Student transcript (delegated to academic-documents service)
	"attestation", // Student attestation (delegated to academic-documents service)
	"student_list", // Class/program/year roster (delegated to academic-documents service)
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
	includeRetakes: z.boolean().default(true), // Whether to apply retake scoring policy
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
 * Input schema for generating an EC (class_course) publication.
 *
 * One PDF aggregates ALL evaluations of a single EC (CC + TP + Examen ...) for
 * every student of the class, with their final EC average + decision +
 * credits. The eligibility rule still applies (sum of percentages = 100%).
 */
export const generateEcSchema = z.object({
	classCourseId: z.string(),
	classId: z.string(),
	semesterId: z.string().optional(),
	academicYearId: z.string().optional(),
	format: exportFormatSchema.default("pdf"),
	templateId: z.string().optional(),
	includeRetakes: z.boolean().default(true),
});

export type GenerateEcInput = z.infer<typeof generateEcSchema>;

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
	includeRetakes: z.boolean().default(true), // Whether to apply retake scoring policy
});

export type GenerateUEInput = z.infer<typeof generateUESchema>;

/**
 * Preview schema - same as generation but always returns HTML
 */
/**
 * Bulk export filters — apply to "tout exporter" actions for evaluations,
 * ECs and UEs. All fields are optional; the absence of a filter means
 * "everything in scope". The institution scope is always enforced via
 * `tenantGradingProcedure`.
 */
export const bulkExportFiltersSchema = z.object({
	academicYearId: z.string().optional(),
	semesterId: z.string().optional(),
	programId: z.string().optional(),
	classId: z.string().optional(),
	/**
	 * For ECs/UEs: skip items whose exams don't sum to 100%, instead of
	 * failing the whole export. Defaults to true so a single bad EC doesn't
	 * abort the entire batch.
	 */
	skipIneligible: z.boolean().default(true),
});

export type BulkExportFilters = z.infer<typeof bulkExportFiltersSchema>;

export const previewPVSchema = generatePVSchema.omit({ format: true });
export const previewEvaluationSchema = generateEvaluationSchema.omit({
	format: true,
});
export const previewEcSchema = generateEcSchema.omit({ format: true });
export const previewUESchema = generateUESchema.omit({ format: true });

export type PreviewPVInput = z.infer<typeof previewPVSchema>;
export type PreviewEcInput = z.infer<typeof previewEcSchema>;
export type PreviewUEInput = z.infer<typeof previewUESchema>;

/** Input schema for generating a deliberation export */
export const generateDeliberationSchema = z.object({
	deliberationId: z.string(),
	format: exportFormatSchema.default("pdf"),
	templateId: z.string().optional(),
});

export type GenerateDeliberationInput = z.infer<
	typeof generateDeliberationSchema
>;

export const previewDeliberationSchema = generateDeliberationSchema.omit({
	format: true,
});
export type PreviewDeliberationInput = z.infer<
	typeof previewDeliberationSchema
>;

export const generateCourseCatalogSchema = z.object({
	classIds: z.array(z.string()).default([]),
	academicYearId: z.string().optional(),
	format: exportFormatSchema.default("pdf"),
});

export type GenerateCourseCatalogInput = z.infer<
	typeof generateCourseCatalogSchema
>;

export const previewTemplateSourceSchema = z.object({
	type: exportTypeSchema,
	templateBody: z.string().min(1),
});

export type PreviewTemplateSourceInput = z.infer<
	typeof previewTemplateSourceSchema
>;
