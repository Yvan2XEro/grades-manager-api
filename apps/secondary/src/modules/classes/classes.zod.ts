import { z } from "zod";

export const listSchema = z.object({
	academicYearId: z.string().uuid().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
});

export const createSchema = z.object({
	name: z.string().min(1).max(50),
	code: z.string().min(1).max(20),
	level: z.string().min(1).max(30),
	academicYearId: z.string().uuid(),
	trackId: z.string().uuid().optional(),
	classMasterId: z.string().uuid().optional(),
	room: z.string().max(50).optional(),
	maxCapacity: z.number().int().positive().optional(),
});

export const idSchema = z.object({
	id: z.string().uuid(),
});

export const rosterSchema = z.object({
	classId: z.string().uuid(),
});
