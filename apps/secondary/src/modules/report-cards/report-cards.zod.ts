import { z } from "zod";

export const generateSchema = z.object({
	studentId: z.string().uuid(),
	termId: z.string().uuid(),
});

export const listSchema = z.object({
	academicYearId: z.string().uuid(),
	termId: z.string().uuid().optional(),
	classId: z.string().uuid().optional(),
});

export const idSchema = z.object({ id: z.string().uuid() });
