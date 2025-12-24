import { z } from "zod";

// Base schemas
export const idSchema = z.object({ id: z.string() });

// Create promotion rule
export const createRuleSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	sourceClassId: z.string().optional(),
	programId: z.string().optional(),
	cycleLevelId: z.string().optional(),
	ruleset: z.record(z.string(), z.unknown()), // json-rules-engine format
	isActive: z.boolean().default(true),
});

// Update promotion rule
export const updateRuleSchema = z.object({
	id: z.string(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	sourceClassId: z.string().optional(),
	programId: z.string().optional(),
	cycleLevelId: z.string().optional(),
	ruleset: z.record(z.string(), z.unknown()).optional(),
	isActive: z.boolean().optional(),
});

// List rules filters
export const listRulesSchema = z.object({
	programId: z.string().optional(),
	sourceClassId: z.string().optional(),
	cycleLevelId: z.string().optional(),
	isActive: z.boolean().optional(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
});

// Evaluate class for promotion
export const evaluateClassSchema = z.object({
	sourceClassId: z.string(),
	ruleId: z.string(),
	academicYearId: z.string(),
});

// Refresh summaries for a class/year
export const refreshClassSummariesSchema = z.object({
	classId: z.string(),
	academicYearId: z.string(),
});

// Apply promotion (execute)
export const applyPromotionSchema = z.object({
	sourceClassId: z.string(),
	targetClassId: z.string(),
	ruleId: z.string(),
	academicYearId: z.string(),
	studentIds: z.array(z.string()).min(1),
});

// List executions
export const listExecutionsSchema = z.object({
	ruleId: z.string().optional(),
	sourceClassId: z.string().optional(),
	targetClassId: z.string().optional(),
	academicYearId: z.string().optional(),
	executedBy: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
});

// Get execution details
export const executionDetailsSchema = z.object({
	executionId: z.string(),
});

// Types inferred from schemas
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type ListRulesInput = z.infer<typeof listRulesSchema>;
export type EvaluateClassInput = z.infer<typeof evaluateClassSchema>;
export type ApplyPromotionInput = z.infer<typeof applyPromotionSchema>;
export type ListExecutionsInput = z.infer<typeof listExecutionsSchema>;
export type ExecutionDetailsInput = z.infer<typeof executionDetailsSchema>;
export type RefreshClassSummariesInput = z.infer<
	typeof refreshClassSummariesSchema
>;
