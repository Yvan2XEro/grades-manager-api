import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./enrollments.service";
import {
	createSchema,
	listSchema,
	updateStatusSchema,
} from "./enrollments.zod";

export const router = trpcRouter({
	list: tenantProcedure.input(listSchema).query(({ ctx, input }) =>
		service.list(ctx.institution.id, input.academicYearId, input.classId, {
			page: input.page,
			pageSize: input.pageSize,
		}),
	),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	updateStatus: adminProcedure
		.input(updateStatusSchema)
		.mutation(({ ctx, input }) =>
			service.updateStatus(input.id, ctx.institution.id, input.status),
		),
	countActive: tenantProcedure.query(({ ctx }) =>
		service.countActive(ctx.institution.id),
	),
});
