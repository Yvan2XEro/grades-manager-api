import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./terms.service";
import {
	createSchema,
	getActiveSchema,
	idSchema,
	listSchema,
} from "./terms.zod";

export const router = trpcRouter({
	list: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.list(input.academicYearId, ctx.institution.id),
		),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	open: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) => service.open(input.id, ctx.institution.id)),
	close: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) => service.close(input.id, ctx.institution.id)),
	getActive: tenantProcedure
		.input(getActiveSchema)
		.query(({ ctx, input }) =>
			service.getActive(input.academicYearId, ctx.institution.id),
		),
});
