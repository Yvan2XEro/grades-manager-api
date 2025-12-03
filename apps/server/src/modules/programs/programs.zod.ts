import { z } from "zod";

export const baseSchema = z.object({
	code: z.string().trim().min(1),
	name: z.string(),
	description: z.string().optional(),
	faculty: z.string(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	facultyId: z.string().optional(),
	q: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const codeSchema = z.object({
	code: z.string().trim().min(1),
	facultyId: z.string(),
});
