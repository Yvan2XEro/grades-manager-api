import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./classes.service";
import {
	createSchema,
	idSchema,
	listSchema,
	rosterSchema,
} from "./classes.zod";

export const router = trpcRouter({
	list: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.list(input.academicYearId, ctx.institution.id),
		),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	get: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) => service.get(input.id, ctx.institution.id)),
	getRoster: tenantProcedure
		.input(rosterSchema)
		.query(({ ctx, input }) =>
			service.getRoster(input.classId, ctx.institution.id),
		),
});
