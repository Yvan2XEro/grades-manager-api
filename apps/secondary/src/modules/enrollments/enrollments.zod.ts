import { z } from "zod";

export const createSchema = z.object({
	studentId: z.string().uuid(),
	academicYearId: z.string().uuid(),
	classId: z.string().uuid(),
	admissionType: z
		.enum(["new", "transfer", "repeat", "promoted"])
		.optional()
		.default("new"),
});

export const listSchema = z.object({
	academicYearId: z.string().uuid(),
	classId: z.string().uuid().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
});

export const updateStatusSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(["active", "transferred", "withdrawn", "graduated"]),
});

export const idSchema = z.object({ id: z.string().uuid() });
