import { z } from "zod";

export const createKeySchema = z.object({
	label: z.string().trim().min(1),
	webhookUrl: z.string().url().optional(),
	webhookSecret: z.string().optional(),
});

export const revokeKeySchema = z.object({ id: z.string() });

export const updateWebhookSchema = z.object({
	id: z.string(),
	webhookUrl: z.string().url().nullable(),
	webhookSecret: z.string().nullable(),
});

export const activityStatsSchema = z.object({
	days: z.number().int().min(7).max(90).default(30),
});

export const callStatsSchema = z.object({
	days: z.number().int().min(7).max(90).default(30),
});
