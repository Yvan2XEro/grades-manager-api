import { z } from "zod";

export const cycleBaseSchema = z.object({
	facultyId: z.string(),
	code: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	totalCreditsRequired: z.number().int().positive().optional(),
	durationYears: z.number().int().positive().optional(),
});

export const updateCycleSchema = cycleBaseSchema.partial().extend({
	id: z.string(),
});

export const cycleListSchema = z.object({
	facultyId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const levelBaseSchema = z.object({
	cycleId: z.string(),
	orderIndex: z.number().int().positive().optional(),
	code: z.string().min(1),
	name: z.string().min(1),
	minCredits: z.number().int().nonnegative().optional(),
});

export const updateLevelSchema = levelBaseSchema.partial().extend({
	id: z.string(),
});

export const levelListSchema = z.object({
	cycleId: z.string(),
});

export const idSchema = z.object({ id: z.string() });
