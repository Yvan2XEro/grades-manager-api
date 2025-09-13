import { z } from "zod";

export const idSchema = z.object({ id: z.string() });

export const emailSchema = z.object({ email: z.string().email() });

export const listSchema = z.object({
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const updateRoleSchema = z.object({
	profileId: z.string(),
	role: z.string(),
});
