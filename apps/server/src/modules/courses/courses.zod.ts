import { z } from "zod";

export const baseSchema = z.object({
	code: z.string().trim().min(1),
	name: z.string(),
	hours: z.number().int().positive(),
	program: z.string(),
	teachingUnitId: z.string(),
	defaultTeacher: z.string(),
	prerequisiteCourseIds: z.array(z.string()).optional(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	programId: z.string().optional(),
	teachingUnitId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const assignSchema = z.object({
	courseId: z.string(),
	teacherId: z.string(),
});

export const codeSchema = z.object({
	code: z.string().trim().min(1),
	programId: z.string(),
});
