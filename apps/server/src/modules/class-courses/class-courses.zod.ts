import { z } from "zod";

export const baseSchema = z.object({
	code: z.string().trim().min(1),
	class: z.string(),
	course: z.string(),
	teacher: z.string(),
	weeklyHours: z.number().int().positive().default(1),
	allowTeacherOverride: z.boolean().optional(),
	semesterId: z.string().optional(),
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

export const codeSchema = z.object({
	code: z.string().trim().min(1),
	academicYearId: z.string(),
});
