import { adminProcedure, router } from "@/lib/trpc";
import * as service from "./notifications.service";
import { idSchema, listSchema, queueSchema } from "./notifications.zod";

export const notificationsRouter = router({
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
		.query(({ input }) => service.list(input.status)),
	flush: adminProcedure.mutation(() => service.sendPending()),
	acknowledge: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.acknowledge(input.id)),
});
