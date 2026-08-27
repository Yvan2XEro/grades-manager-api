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
});

export const updateStatusSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(["active", "transferred", "withdrawn", "graduated"]),
});

export const idSchema = z.object({ id: z.string().uuid() });
