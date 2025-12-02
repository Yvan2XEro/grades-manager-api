import { z } from "zod";

export const baseSchema = z.object({
	programId: z.string(),
	name: z.string().min(1),
	code: z.string().min(1),
	description: z.string().optional(),
});

export const updateSchema = baseSchema.partial().extend({
	id: z.string(),
});

export const listSchema = z.object({
	programId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });
