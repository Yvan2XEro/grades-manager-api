import { z } from "zod";

export const upsertSchema = z.object({
	studentId: z.string(),
	examId: z.string(),
	score: z.number(),
});

export const updateSchema = z.object({
	id: z.string(),
	score: z.number(),
});

export const idSchema = z.object({ id: z.string() });

export const listExamSchema = z.object({
	examId: z.string(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const listStudentSchema = z.object({
	studentId: z.string(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const listClassCourseSchema = z.object({
	classCourseId: z.string(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const avgExamSchema = z.object({ examId: z.string() });

export const avgCourseSchema = z.object({ courseId: z.string() });

export const avgStudentCourseSchema = z.object({
	studentId: z.string(),
	courseId: z.string(),
});

export const exportClassCourseSchema = z.object({
	classCourseId: z.string(),
});

export const importCsvSchema = z.object({
	examId: z.string(),
	csv: z.string().min(1),
});

export const consolidatedSchema = z.object({
	studentId: z.string(),
});
