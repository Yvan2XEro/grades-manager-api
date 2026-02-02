import { z } from "zod";

export const baseSchema = z.object({
	code: z.string().trim().min(1),
	class: z.string(),
	course: z.string(),
	teacher: z.string(),
	/** Coefficient for weighted average calculation within a Teaching Unit (UE).
	 * Default is 1.0, meaning equal weight for all courses.
	 * Used to calculate: UE_average = Σ(EC_grade × coefficient) / Σ(coefficient)
	 */
	coefficient: z.number().positive().default(1),
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

export const searchSchema = z.object({
	query: z.string().trim(),
	classId: z.string().optional(),
	limit: z.number().optional(),
});
