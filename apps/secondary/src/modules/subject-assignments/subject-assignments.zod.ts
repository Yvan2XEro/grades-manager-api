import { z } from "zod";

export const createSchema = z.object({
	staffId: z.string().uuid(),
	subjectId: z.string().uuid(),
	classId: z.string().uuid(),
	academicYearId: z.string().uuid(),
});

export const listSchema = z.object({
	academicYearId: z.string().uuid(),
	classId: z.string().uuid().optional(),
	staffId: z.string().uuid().optional(),
});

export const idSchema = z.object({ id: z.string().uuid() });
