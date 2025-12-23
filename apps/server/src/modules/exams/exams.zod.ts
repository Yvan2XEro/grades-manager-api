import { z } from "zod";

export const baseSchema = z.object({
	name: z.string(),
	type: z.string(),
	date: z.coerce.date(),
	percentage: z.number(),
	classCourseId: z.string(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	classCourseId: z.string().optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	academicYearId: z.string().optional(),
	query: z.string().trim().min(1).optional(),
	classId: z.string().optional(),
	semesterId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const lockSchema = z.object({ examId: z.string(), lock: z.boolean() });

export const submitSchema = z.object({ examId: z.string() });

export const validateSchema = z.object({
	examId: z.string(),
	status: z.enum(["approved", "rejected"]),
});
