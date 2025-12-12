import { z } from "zod";

export const baseSchema = z.object({
	code: z.string().trim().min(1),
	name: z.string().trim().min(1),
	description: z.string().optional(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const idSchema = z.object({ id: z.string() });

export const listSchema = z.object({
	q: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const codeSchema = z.object({ code: z.string().trim().min(1) });

export const searchSchema = z.object({
	query: z.string().trim(),
	limit: z.number().optional(),
});
