import { z } from "zod";

export const exportTemplateAssignmentSchema = z.object({
	templateType: z.enum(["pv", "evaluation", "ue", "deliberation"]),
	templateId: z.string().min(1),
});

export const baseSchema = z.object({
	code: z.string().trim().min(1),
	name: z.string(),
	nameEn: z.string().optional().nullable(),
	abbreviation: z.string().optional().nullable(),
	description: z.string().optional(),
	domainFr: z.string().optional().nullable(),
	domainEn: z.string().optional().nullable(),
	specialiteFr: z.string().optional().nullable(),
	specialiteEn: z.string().optional().nullable(),
	diplomaTitleFr: z.string().optional(),
	diplomaTitleEn: z.string().optional(),
	attestationValidityFr: z.string().optional(),
	attestationValidityEn: z.string().optional(),
	cycleId: z.string().optional().nullable(),
	centerId: z.string().optional().nullable(),
	isCenterProgram: z.boolean().optional(),
	exportTemplates: z.array(exportTemplateAssignmentSchema).optional(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	q: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
	centerId: z.string().optional(),
	isCenterProgram: z.boolean().optional(),
});

export const setExportTemplatesSchema = z.object({
	programId: z.string(),
	templates: z.array(exportTemplateAssignmentSchema),
});

export const programIdSchema = z.object({ programId: z.string() });

export const idSchema = z.object({ id: z.string() });

export const codeSchema = z.object({
	code: z.string().trim().min(1),
});

export const searchSchema = z.object({
	query: z.string().trim(),
	limit: z.number().optional(),
});

export const cloneCurriculumSchema = z.object({
	targetProgramId: z.string(),
	sourceProgramId: z.string(),
});
