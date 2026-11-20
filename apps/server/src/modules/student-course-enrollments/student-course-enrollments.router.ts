import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import { findGatingRule } from "@/modules/fee-clearance/fee-clearance.repo";
import * as service from "./student-course-enrollments.service";
import {
	autoEnrollClassSchema,
	bulkSchema,
	closeSchema,
	createSchema,
	idSchema,
	listSchema,
	updateStatusSchema,
} from "./student-course-enrollments.zod";

export const studentCourseEnrollmentsRouter = router({
	create: tenantAdminProcedure
		.input(createSchema)
		.mutation(({ input, ctx }) =>
			service.createEnrollment(input, ctx.institution.id),
		),
	bulkEnroll: tenantAdminProcedure
		.input(bulkSchema)
		.mutation(({ input, ctx }) =>
			service.bulkEnroll(input, ctx.institution.id),
		),
	updateStatus: tenantAdminProcedure
		.input(updateStatusSchema)
		.mutation(({ input, ctx }) =>
			service.updateStatus(input.id, ctx.institution.id, input.status),
		),
	autoEnrollClass: tenantAdminProcedure
		.input(autoEnrollClassSchema)
		.mutation(async ({ input, ctx }) => {
			const gateEnabled =
				(await findGatingRule(ctx.institution.id, "exam_registration"))
					?.isEnabled ?? false;
			return service.autoEnrollClass(input, {
				institutionId: ctx.institution.id,
				checkFeeGate: gateEnabled && !ctx.permissions.canOverrideFeeGates,
			});
		}),
	closeForStudent: tenantAdminProcedure
		.input(closeSchema)
		.mutation(({ input, ctx }) =>
			service.closeForStudent(input, ctx.institution.id),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) => service.getById(input.id, ctx.institution.id)),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ input, ctx }) => service.list(input, ctx.institution.id)),
});
