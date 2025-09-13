import { z } from "zod";

export const baseSchema = z.object({
	name: z.string(),
	credits: z.number(),
	hours: z.number(),
	program: z.string(),
	defaultTeacher: z.string(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	programId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const assignSchema = z.object({
	courseId: z.string(),
	teacherId: z.string(),
});
