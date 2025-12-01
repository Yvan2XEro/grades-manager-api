import { z } from "zod";

const statusEnum = z.enum([
	"planned",
	"active",
	"completed",
	"failed",
	"withdrawn",
]);

export const createSchema = z.object({
	studentId: z.string(),
	classCourseId: z.string(),
	status: statusEnum.default("planned"),
	attempt: z.number().int().positive().default(1),
});

export const bulkSchema = z.object({
	studentId: z.string(),
	classCourseIds: z.array(z.string()).min(1),
	status: statusEnum.default("active"),
	attempt: z.number().int().positive().default(1),
});

export const updateStatusSchema = z.object({
	id: z.string(),
	status: statusEnum,
});

export const listSchema = z.object({
	studentId: z.string().optional(),
	classCourseId: z.string().optional(),
	courseId: z.string().optional(),
	status: statusEnum.optional(),
	cursor: z.string().optional(),
	limit: z.number().int().min(1).max(100).optional(),
});

export const idSchema = z.object({ id: z.string() });

export const closeSchema = z.object({
	studentId: z.string(),
	status: statusEnum.default("withdrawn"),
});
