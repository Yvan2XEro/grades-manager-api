import { z } from "zod";

export const createSchema = z.object({
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	dateOfBirth: z.coerce.date().optional(),
	placeOfBirth: z.string().max(100).optional(),
	gender: z.enum(["M", "F"]).optional(),
	mnu: z.string().max(50).optional(),
	registrationNumber: z.string().max(50).optional(),
	contactName: z.string().max(200).optional(),
	contactPhone: z.string().max(30).optional(),
	contactEmail: z.string().email().max(255).optional(),
	contactRelation: z.enum(["father", "mother", "guardian"]).optional(),
	reportCardLanguage: z.enum(["fr", "en"]).optional().default("fr"),
});

export const updateSchema = createSchema.partial().extend({
	id: z.string().uuid(),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const listSchema = z.object({
	search: z.string().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
});
