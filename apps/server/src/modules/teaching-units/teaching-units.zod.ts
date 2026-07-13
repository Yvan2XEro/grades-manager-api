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

export const listPagedSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
	programId: z.string().optional(),
});

export const idSchema = z.object({ id: z.string() });
