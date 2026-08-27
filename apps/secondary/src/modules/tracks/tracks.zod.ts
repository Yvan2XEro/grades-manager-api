import { z } from "zod";

export const listSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
});

export const createSchema = z.object({
	name: z.string().min(1).max(100),
	code: z.string().min(1).max(20),
	cycleLevel: z.enum(["first_cycle", "second_cycle", "technical"]),
	isOfficial: z.boolean().optional().default(false),
});

export const upsertCoefficientSchema = z.object({
	trackId: z.string().uuid(),
	subjectId: z.string().uuid(),
	coefficient: z.number().int().min(0).max(20),
	isOfficialExamSubject: z.boolean().optional().default(false),
});

export const getGridSchema = z.object({
	trackId: z.string().uuid(),
});
