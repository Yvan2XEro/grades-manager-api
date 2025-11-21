import { z } from "zod";

export const queueSchema = z.object({
	recipientId: z.string().uuid().optional(),
	channel: z.enum(["email", "webhook"]).default("email"),
	type: z.string(),
	payload: z.record(z.unknown()).default({}),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const listSchema = z.object({
	status: z.enum(["pending", "sent", "failed"]).optional(),
});
