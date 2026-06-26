import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./notifications.service";
import { idSchema, listSchema, queueSchema } from "./notifications.zod";

export const notificationsRouter = router({
	// ── Admin ──────────────────────────────────────────────────────────────────
	queue: adminProcedure.input(queueSchema).mutation(({ input }) =>
		service.queueNotification({
			recipientId: input.recipientId,
			channel: input.channel,
			type: input.type,
			payload: input.payload,
		}),
	),
	list: adminProcedure
		.input(listSchema)
		.query(({ input }) =>
			service.list(input.status, input.limit, input.cursor),
		),
	flush: adminProcedure.mutation(() => service.sendPending()),
	acknowledge: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.acknowledge(input.id)),

	// ── Self-service in-app ────────────────────────────────────────────────────
	myNotifications: protectedProcedure
		.input(z.object({ limit: z.number().int().min(1).max(50).optional() }))
		.query(({ ctx, input }) => {
			if (!ctx.profile?.id) return [];
			return service.myInAppNotifications(ctx.profile.id, input.limit);
		}),

	unreadCount: protectedProcedure.query(({ ctx }) => {
		if (!ctx.profile?.id) return 0;
		return service.unreadCount(ctx.profile.id);
	}),

	markRead: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) => {
			if (!ctx.profile?.id) throw new Error("Profile required");
			return service.markRead(input.id, ctx.profile.id);
		}),

	markAllRead: protectedProcedure.mutation(({ ctx }) => {
		if (!ctx.profile?.id) return;
		return service.markAllRead(ctx.profile.id);
	}),
});
