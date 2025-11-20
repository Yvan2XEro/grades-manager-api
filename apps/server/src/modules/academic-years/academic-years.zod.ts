import { z } from "zod";

export const baseSchema = z.object({
	name: z.string(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const idSchema = z.object({ id: z.string() });

export const listSchema = z.object({
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const setActiveSchema = z.object({
	id: z.string(),
	isActive: z.boolean(),
});
