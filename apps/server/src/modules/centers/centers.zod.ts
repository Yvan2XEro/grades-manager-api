import { z } from "zod";

export const administrativeInstanceSchema = z.object({
	id: z.string().optional(),
	orderIndex: z.number().int().nonnegative().optional(),
	nameFr: z.string().trim().min(1),
	nameEn: z.string().trim().min(1),
	acronymFr: z.string().optional().nullable(),
	acronymEn: z.string().optional().nullable(),
	logoUrl: z.string().optional().nullable(),
	showOnTranscripts: z.boolean().optional(),
	showOnCertificates: z.boolean().optional(),
});

export const legalTextSchema = z.object({
	id: z.string().optional(),
	orderIndex: z.number().int().nonnegative().optional(),
	textFr: z.string().trim().min(1),
	textEn: z.string().trim().min(1),
});

export const baseSchema = z.object({
	code: z.string().trim().min(1),
	shortName: z.string().optional().nullable(),
	name: z.string().trim().min(1),
	nameEn: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	addressFr: z.string().optional().nullable(),
	addressEn: z.string().optional().nullable(),
	city: z.string().optional().nullable(),
	country: z.string().optional().nullable(),
	postalBox: z.string().optional().nullable(),
	contactEmail: z.string().email().optional().nullable().or(z.literal("")),
	contactPhone: z.string().optional().nullable(),
	logoUrl: z.string().optional().nullable(),
	adminInstanceLogoUrl: z.string().optional().nullable(),
	watermarkLogoUrl: z.string().optional().nullable(),
	authorizationOrderFr: z.string().optional().nullable(),
	authorizationOrderEn: z.string().optional().nullable(),
	isActive: z.boolean().optional(),
	administrativeInstances: z.array(administrativeInstanceSchema).optional(),
	legalTexts: z.array(legalTextSchema).optional(),
});

export const updateSchema = baseSchema.partial().extend({
	id: z.string(),
});

export const listSchema = z.object({
	q: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
	includeInactive: z.boolean().optional(),
});

export const idSchema = z.object({ id: z.string() });

export type CenterBaseInput = z.infer<typeof baseSchema>;
export type CenterUpdateInput = z.infer<typeof updateSchema>;
export type AdministrativeInstanceInput = z.infer<
	typeof administrativeInstanceSchema
>;
export type LegalTextInput = z.infer<typeof legalTextSchema>;
