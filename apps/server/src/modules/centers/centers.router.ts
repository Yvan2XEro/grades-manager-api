import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./centers.service";
import { baseSchema, idSchema, listSchema, updateSchema } from "./centers.zod";

export const centersRouter = router({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createCenter(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateCenter(input.id, ctx.institution.id, input),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteCenter(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) => service.listCenters(input, ctx.institution.id)),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getCenterById(input.id, ctx.institution.id),
		),
});
