import { z } from "zod";

export const listSchema = z.object({
	academicYearId: z.string().uuid(),
});

export const createSchema = z.object({
	academicYearId: z.string().uuid(),
	termNumber: z.number().int().min(1).max(3),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
});

export const idSchema = z.object({
	id: z.string().uuid(),
});

export const getActiveSchema = z.object({
	academicYearId: z.string().uuid(),
});
