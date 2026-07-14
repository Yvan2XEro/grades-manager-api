import { z } from "zod";

export const listNotificationsPagedSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
	status: z.enum(["pending", "sent", "failed", "retrying"]).optional(),
	channel: z.enum(["email", "webhook", "in-app"]).optional(),
});

export type ListNotificationsPagedInput = z.infer<
	typeof listNotificationsPagedSchema
>;

export const queueSchema = z.object({
	recipientId: z.string().uuid().optional(),
	channel: z.enum(["email", "webhook"]).default("email"),
	type: z.string(),
	payload: z.record(z.string(), z.unknown()).default({}),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const listSchema = z.object({
	status: z.enum(["pending", "sent", "failed", "retrying"]).optional(),
	channel: z.enum(["email", "webhook", "in-app"]).optional(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(100).optional(),
});
