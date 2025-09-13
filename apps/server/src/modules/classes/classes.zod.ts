import { z } from "zod";

export const baseSchema = z.object({
	name: z.string(),
	program: z.string(),
	academicYear: z.string(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	programId: z.string().optional(),
	academicYearId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const transferSchema = z.object({
	studentId: z.string(),
	toClassId: z.string(),
});
