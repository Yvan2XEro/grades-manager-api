import { z } from "zod";

export const baseSchema = z.object({
	name: z.string().min(1),
	code: z.string().min(1),
	description: z.string().optional(),
	credits: z.number().int().nonnegative().default(0),
	semester: z.enum(["fall", "spring", "annual"]).default("annual"),
	programId: z.string(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	programId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().int().optional(),
});

export const idSchema = z.object({ id: z.string() });
