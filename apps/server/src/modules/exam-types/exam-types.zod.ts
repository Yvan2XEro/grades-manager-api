import { z } from "zod";

export const baseSchema = z.object({
	name: z.string().min(2),
	description: z.string().optional(),
	defaultPercentage: z.number().int().min(1).max(100).optional(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });
