import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./enrollments.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	statusSchema,
	updateSchema,
} from "./enrollments.zod";

export const enrollmentsRouter = router({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createEnrollment(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateEnrollment(input.id, input, ctx.institution.id),
		),
	updateStatus: tenantAdminProcedure
		.input(statusSchema)
		.mutation(({ ctx, input }) =>
			service.updateStatus(input.id, input.status, ctx.institution.id),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getEnrollmentById(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listEnrollments(input, ctx.institution.id),
		),
});
