import { z } from "zod";

export const listSchema = z.object({
	search: z.string().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
});

export const createSchema = z.object({
	name: z.string().min(1).max(100),
	nameFr: z.string().min(1).max(100).optional().default(""),
	code: z.string().min(1).max(30),
	minesecCode: z.string().max(30).optional(),
	subjectGroup: z.string().max(50).optional(),
});

export const updateSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(100).optional(),
	nameFr: z.string().min(1).max(100).optional(),
	code: z.string().min(1).max(30).optional(),
	minesecCode: z.string().max(30).optional(),
	subjectGroup: z.string().max(50).optional(),
});
