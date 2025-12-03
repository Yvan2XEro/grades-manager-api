import { z } from "zod";

export const baseSchema = z.object({
	code: z.string().trim().min(1),
	name: z.string(),
	program: z.string(),
	academicYear: z.string(),
	cycleLevelId: z.string().optional(),
	programOptionId: z.string().optional(),
	semesterId: z.string().optional(),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	programId: z.string().optional(),
	academicYearId: z.string().optional(),
	facultyId: z.string().optional(),
	cycleId: z.string().optional(),
	cycleLevelId: z.string().optional(),
	programOptionId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
	semesterId: z.string().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const transferSchema = z.object({
	studentId: z.string(),
	toClassId: z.string(),
});

export const codeSchema = z.object({
	code: z.string().trim().min(1),
	academicYearId: z.string(),
});
