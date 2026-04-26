import { z } from "zod";

export const documentKindSchema = z.enum([
	"diploma",
	"transcript",
	"attestation",
	"student_list",
]);
export type DocumentKind = z.infer<typeof documentKindSchema>;

/** Filters for selecting a roster of students. Provide at least one. */
export const generateStudentListSchema = z.object({
	classId: z.string().optional(),
	programId: z.string().optional(),
	academicYearId: z.string().optional(),
	studentIds: z.array(z.string()).optional(),
	templateId: z.string().optional(),
	themeOverrides: z.record(z.string(), z.unknown()).optional(),
	format: z.enum(["pdf", "html"]).default("pdf"),
	demoMode: z.boolean().default(false),
});
export type GenerateStudentListInput = z.infer<
	typeof generateStudentListSchema
>;

const formatSchema = z.enum(["pdf", "html"]).default("pdf");

export const generateDocumentSchema = z.object({
	kind: documentKindSchema,
	studentId: z.string(),
	/** Optional — if provided, results are pulled from the deliberation's snapshot. */
	deliberationId: z.string().optional(),
	/**
	 * Override the resolved template (e.g., admin previewing a different one).
	 * The template's type must match `kind`.
	 */
	templateId: z.string().optional(),
	/**
	 * Per-call ephemeral theme overrides. Useful for live preview from the UI
	 * theme editor before saving.
	 */
	themeOverrides: z.record(z.string(), z.unknown()).optional(),
	format: formatSchema,
	demoMode: z.boolean().default(false),
});
export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;

export const previewDocumentSchema = generateDocumentSchema
	.omit({ format: true })
	.extend({ format: z.literal("html").default("html") });
export type PreviewDocumentInput = z.infer<typeof previewDocumentSchema>;

export const previewDocumentBodySchema = z.object({
	kind: documentKindSchema,
	templateBody: z.string().min(1),
	themeOverrides: z.record(z.string(), z.unknown()).optional(),
	studentId: z.string().optional(),
	deliberationId: z.string().optional(),
	demoMode: z.boolean().default(true),
});
export type PreviewDocumentBodyInput = z.infer<
	typeof previewDocumentBodySchema
>;

export const generateBatchSchema = z.object({
	kind: documentKindSchema,
	classId: z.string().optional(),
	deliberationId: z.string().optional(),
	studentIds: z.array(z.string()).optional(),
	templateId: z.string().optional(),
	demoMode: z.boolean().default(false),
});
export type GenerateBatchInput = z.infer<typeof generateBatchSchema>;

export const resolveTemplateForClassSchema = z.object({
	classId: z.string(),
	kind: documentKindSchema,
});
export type ResolveTemplateForClassInput = z.infer<
	typeof resolveTemplateForClassSchema
>;
