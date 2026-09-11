import { z } from "zod";

const ROLES = [
	"teacher",
	"admin",
	"principal",
	"vice_principal",
	"staff",
] as const;

export const createSchema = z.object({
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	email: z.string().email().max(255),
	phone: z.string().max(30).optional(),
	role: z.enum(ROLES).optional().default("teacher"),
});

export const updateSchema = z.object({
	id: z.string().uuid(),
	firstName: z.string().min(1).max(100).optional(),
	lastName: z.string().min(1).max(100).optional(),
	email: z.string().email().max(255).optional(),
	phone: z.string().max(30).optional(),
	role: z.enum(ROLES).optional(),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const listSchema = z.object({
	search: z.string().optional(),
	role: z.enum(ROLES).optional(),
	orderBy: z
		.enum(["lastName", "firstName", "email"])
		.optional()
		.default("lastName"),
	orderDir: z.enum(["asc", "desc"]).optional().default("asc"),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(500).default(25),
});
