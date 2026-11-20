import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./notifications.service";
import {
	idSchema,
	listNotificationsPagedSchema,
	listSchema,
	queueSchema,
} from "./notifications.zod";

export const notificationsRouter = router({
	// ── Admin ──────────────────────────────────────────────────────────────────
	// A notification belongs to the institution of its recipient.
	queue: tenantAdminProcedure.input(queueSchema).mutation(({ ctx, input }) =>
		service.queueForInstitution(ctx.institution, {
			recipientId: input.recipientId,
			channel: input.channel,
			type: input.type,
			payload: input.payload,
		}),
	),
	list: tenantAdminProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.list(
				ctx.institution,
				input.status,
				input.limit,
				input.cursor,
				input.channel,
			),
		),
	listPaged: tenantAdminProcedure
		.input(listNotificationsPagedSchema)
		.query(({ ctx, input }) =>
			service.listPaged({ ...input, scope: ctx.institution }),
		),
	flush: tenantAdminProcedure.mutation(({ ctx }) =>
		service.sendPending(25, undefined, ctx.institution),
	),
	acknowledge: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.acknowledge(input.id, ctx.institution),
		),
	stats: tenantAdminProcedure.query(({ ctx }) =>
		service.stats(ctx.institution),
	),
	retry: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) => service.requeue(input.id, ctx.institution)),

	// ── Self-service in-app ────────────────────────────────────────────────────
	myNotifications: tenantProtectedProcedure
		.input(
			z.object({
				limit: z.number().int().min(1).max(50).optional(),
				cursor: z.string().optional(),
			}),
		)
		.query(({ ctx, input }) => {
			if (!ctx.profile?.id) return { items: [], nextCursor: undefined };
			return service.myInAppNotifications(
				ctx.profile.id,
				input.limit,
				input.cursor,
			);
		}),

	unreadCount: tenantProtectedProcedure.query(({ ctx }) => {
		if (!ctx.profile?.id) return 0;
		return service.unreadCount(ctx.profile.id);
	}),

	markRead: tenantProtectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) => {
			if (!ctx.profile?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
			return service.markRead(input.id, ctx.profile.id);
		}),

	markAllRead: tenantProtectedProcedure.mutation(({ ctx }) => {
		if (!ctx.profile?.id) return;
		return service.markAllRead(ctx.profile.id);
	}),
});
