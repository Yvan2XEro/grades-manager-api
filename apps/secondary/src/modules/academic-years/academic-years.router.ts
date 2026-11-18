import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./academic-years.service";
import { createSchema, idSchema } from "./academic-years.zod";

export const router = trpcRouter({
	list: tenantProcedure.query(({ ctx }) => service.list(ctx.institution.id)),

	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),

	setActive: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.setActive(input.id, ctx.institution.id),
		),

	close: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) => service.close(input.id, ctx.institution.id)),
});
