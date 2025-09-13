import { z } from "zod";

export const baseSchema = z.object({
	class: z.string(),
	course: z.string(),
	teacher: z.string(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	classId: z.string().optional(),
	courseId: z.string().optional(),
	teacherId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });
