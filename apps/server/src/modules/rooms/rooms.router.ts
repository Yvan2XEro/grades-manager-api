import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./rooms.service";
import {
	createRoomSchema,
	deleteRoomSchema,
	listRoomsSchema,
	updateRoomSchema,
} from "./rooms.zod";

export const roomsRouter = router({
	list: tenantProtectedProcedure
		.input(listRoomsSchema)
		.query(({ ctx, input }) => service.listRooms(ctx.institution.id, input)),

	create: tenantAdminProcedure
		.input(createRoomSchema)
		.mutation(({ ctx, input }) =>
			service.createRoom(ctx.institution.id, input),
		),

	update: tenantAdminProcedure
		.input(updateRoomSchema)
		.mutation(({ ctx, input }) =>
			service.updateRoom(ctx.institution.id, input),
		),

	delete: tenantAdminProcedure
		.input(deleteRoomSchema)
		.mutation(({ ctx, input }) =>
			service.deleteRoom(input.id, ctx.institution.id),
		),
});
