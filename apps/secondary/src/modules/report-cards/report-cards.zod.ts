import { z } from "zod";

export const generateSchema = z.object({
	studentId: z.string().uuid(),
	termId: z.string().uuid(),
});

export const listSchema = z.object({
	academicYearId: z.string().uuid(),
	termId: z.string().uuid().optional(),
	classId: z.string().uuid().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
});

export const idSchema = z.object({ id: z.string().uuid() });
