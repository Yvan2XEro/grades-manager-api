import { z } from "zod";

export const listSchema = z.object({
	search: z.string().optional(),
	subjectGroup: z.string().optional(),
	orderBy: z.enum(["name", "code", "subjectGroup"]).optional().default("name"),
	orderDir: z.enum(["asc", "desc"]).optional().default("asc"),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(500).default(25),
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
