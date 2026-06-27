import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./rooms.service";
import {
	createRoomSchema,
	deleteRoomSchema,
	listRoomsSchema,
	updateRoomSchema,
} from "./rooms.zod";

export const roomsRouter = router({
	list: protectedProcedure
		.input(listRoomsSchema)
		.query(({ ctx, input }) => service.listRooms(ctx.institution.id, input)),

	create: adminProcedure
		.input(createRoomSchema)
		.mutation(({ ctx, input }) =>
			service.createRoom(ctx.institution.id, input),
		),

	update: adminProcedure
		.input(updateRoomSchema)
		.mutation(({ ctx, input }) =>
			service.updateRoom(ctx.institution.id, input),
		),

	delete: adminProcedure
		.input(deleteRoomSchema)
		.mutation(({ ctx, input }) =>
			service.deleteRoom(input.id, ctx.institution.id),
		),
});
