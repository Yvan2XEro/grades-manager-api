import { z } from "zod";
import {
	deliberationDecisions,
	deliberationMentions,
	deliberationRuleCategories,
	deliberationTypes,
} from "@/db/schema/app-schema";

// Base
export const idSchema = z.object({ id: z.string() });

// Jury member schema
const juryMemberSchema = z.object({
	domainUserId: z.string(),
	name: z.string(),
	role: z.string(),
});

// Deliberation CRUD
export const createDeliberationSchema = z.object({
	classId: z.string(),
	semesterId: z.string().optional(),
	academicYearId: z.string(),
	type: z.enum(deliberationTypes as unknown as [string, ...string[]]),
	presidentId: z.string().optional(),
	juryMembers: z.array(juryMemberSchema).default([]),
	deliberationDate: z.string().datetime().optional(),
});

export const updateDeliberationSchema = z.object({
	id: z.string(),
	presidentId: z.string().optional(),
	juryMembers: z.array(juryMemberSchema).optional(),
	deliberationDate: z.string().datetime().optional(),
});

// State transitions
export const transitionDeliberationSchema = z.object({
	id: z.string(),
	action: z.enum(["open", "close", "sign", "reopen"]),
});

// Compute
export const computeDeliberationSchema = z.object({
	id: z.string(),
});

// Override decision
export const overrideDecisionSchema = z.object({
	deliberationId: z.string(),
	studentResultId: z.string(),
	finalDecision: z.enum(
		deliberationDecisions as unknown as [string, ...string[]],
	),
	reason: z.string().min(1),
	mention: z
		.enum(deliberationMentions as unknown as [string, ...string[]])
		.optional(),
});

// List deliberations
export const listDeliberationsSchema = z.object({
	classId: z.string().optional(),
	academicYearId: z.string().optional(),
	type: z
		.enum(deliberationTypes as unknown as [string, ...string[]])
		.optional(),
	status: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
});

// Export diplomation
export const exportDiplomationSchema = z.object({
	id: z.string(),
});

// Get logs
export const getLogsSchema = z.object({
	deliberationId: z.string(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
});

// Promote admitted students
export const promoteAdmittedSchema = z.object({
	deliberationId: z.string(),
	targetClassId: z.string(),
});

export type PromoteAdmittedInput = z.infer<typeof promoteAdmittedSchema>;

// Deliberation Rules CRUD
export const createDeliberationRuleSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	category: z.enum(
		deliberationRuleCategories as unknown as [string, ...string[]],
	),
	programId: z.string().optional(),
	cycleLevelId: z.string().optional(),
	deliberationType: z
		.enum(deliberationTypes as unknown as [string, ...string[]])
		.optional(),
	priority: z.number().int().default(0),
	ruleset: z.record(z.string(), z.unknown()),
	decision: z.enum(deliberationDecisions as unknown as [string, ...string[]]),
	isActive: z.boolean().default(true),
});

export const updateDeliberationRuleSchema = z.object({
	id: z.string(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	category: z
		.enum(deliberationRuleCategories as unknown as [string, ...string[]])
		.optional(),
	programId: z.string().optional(),
	cycleLevelId: z.string().optional(),
	deliberationType: z
		.enum(deliberationTypes as unknown as [string, ...string[]])
		.optional(),
	priority: z.number().int().optional(),
	ruleset: z.record(z.string(), z.unknown()).optional(),
	decision: z
		.enum(deliberationDecisions as unknown as [string, ...string[]])
		.optional(),
	isActive: z.boolean().optional(),
});

export const listDeliberationRulesSchema = z.object({
	category: z
		.enum(deliberationRuleCategories as unknown as [string, ...string[]])
		.optional(),
	programId: z.string().optional(),
	cycleLevelId: z.string().optional(),
	deliberationType: z
		.enum(deliberationTypes as unknown as [string, ...string[]])
		.optional(),
	isActive: z.boolean().optional(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
});

// Inferred types
export type CreateDeliberationInput = z.infer<typeof createDeliberationSchema>;
export type UpdateDeliberationInput = z.infer<typeof updateDeliberationSchema>;
export type TransitionDeliberationInput = z.infer<
	typeof transitionDeliberationSchema
>;
export type ComputeDeliberationInput = z.infer<
	typeof computeDeliberationSchema
>;
export type OverrideDecisionInput = z.infer<typeof overrideDecisionSchema>;
export type ListDeliberationsInput = z.infer<typeof listDeliberationsSchema>;
export type ExportDiplomationInput = z.infer<typeof exportDiplomationSchema>;
export type GetLogsInput = z.infer<typeof getLogsSchema>;
export type CreateDeliberationRuleInput = z.infer<
	typeof createDeliberationRuleSchema
>;
export type UpdateDeliberationRuleInput = z.infer<
	typeof updateDeliberationRuleSchema
>;
export type ListDeliberationRulesInput = z.infer<
	typeof listDeliberationRulesSchema
>;
