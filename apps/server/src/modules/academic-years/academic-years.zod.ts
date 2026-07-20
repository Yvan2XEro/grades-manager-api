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

export const listPagedSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
});

export const setActiveSchema = z.object({
	id: z.string(),
	isActive: z.boolean(),
});

export const createNextYearSchema = z.object({
	sourceYearId: z.string(),
});
