import { z } from "zod";

export const baseSchema = z.object({
	code: z.string().trim().min(1),
	name: z.string().trim().min(1),
	cycleId: z.string(),
	orderIndex: z.number().int().positive(),
	minCredits: z.number().int().nonnegative().optional(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const idSchema = z.object({ id: z.string() });

export const listSchema = z.object({
	cycleId: z.string().optional(),
	q: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const codeSchema = z.object({
	code: z.string().trim().min(1),
	cycleId: z.string(),
});

export const searchSchema = z.object({
	query: z.string().trim(),
	cycleId: z.string().optional(),
	limit: z.number().optional(),
});
