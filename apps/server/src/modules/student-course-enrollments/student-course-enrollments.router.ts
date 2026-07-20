import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
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
	create: adminProcedure
		.input(createSchema)
		.mutation(({ input }) => service.createEnrollment(input)),
	bulkEnroll: adminProcedure
		.input(bulkSchema)
		.mutation(({ input }) => service.bulkEnroll(input)),
	updateStatus: adminProcedure
		.input(updateStatusSchema)
		.mutation(({ input, ctx }) =>
			service.updateStatus(input.id, ctx.institution.id, input.status),
		),
	autoEnrollClass: adminProcedure
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
	closeForStudent: adminProcedure
		.input(closeSchema)
		.mutation(({ input, ctx }) =>
			service.closeForStudent(input, ctx.institution.id),
		),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) => service.getById(input.id, ctx.institution.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input, ctx }) => service.list(input, ctx.institution.id)),
});
