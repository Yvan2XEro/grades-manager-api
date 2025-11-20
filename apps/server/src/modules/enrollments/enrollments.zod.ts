import { z } from "zod";

const statusEnum = z.enum(["pending", "active", "completed", "withdrawn"]);

export const baseSchema = z.object({
	studentId: z.string(),
	classId: z.string(),
	academicYearId: z.string(),
	status: statusEnum.default("pending"),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	studentId: z.string().optional(),
	classId: z.string().optional(),
	academicYearId: z.string().optional(),
	status: statusEnum.optional(),
	cursor: z.string().optional(),
	limit: z.number().int().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const statusSchema = z.object({
	id: z.string(),
	status: statusEnum,
});
