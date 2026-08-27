import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./tracks.service";
import {
	createSchema,
	getGridSchema,
	upsertCoefficientSchema,
} from "./tracks.zod";

export const router = trpcRouter({
	list: tenantProcedure.query(({ ctx }) => service.list(ctx.institution.id)),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	upsertCoefficient: adminProcedure
		.input(upsertCoefficientSchema)
		.mutation(({ ctx, input }) =>
			service.upsertCoefficient(input, ctx.institution.id),
		),
	getCoefficientsGrid: tenantProcedure
		.input(getGridSchema)
		.query(({ ctx, input }) =>
			service.getCoefficientsGrid(input.trackId, ctx.institution.id),
		),
});
