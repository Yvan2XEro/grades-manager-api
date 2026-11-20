import { TRPCError } from "@trpc/server";
import { adminProcedure, router, tenantProtectedProcedure } from "@/lib/trpc";
import { hasInstitutionWideRecordAccess } from "@/modules/authz";
import {
	assertCanReadClassCourse,
	assertCanReadCourse,
	assertCanReadStudent,
	recordActorFromCtx,
} from "@/modules/authz/record-access";
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
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(async ({ input, ctx }) => {
			const item = await service.getById(input.id, ctx.institution.id);
			await assertCanReadStudent(
				recordActorFromCtx(ctx),
				item.studentId,
				ctx.institution.id,
			);
			return item;
		}),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(async ({ input, ctx }) => {
			const actor = recordActorFromCtx(ctx);
			const institutionId = ctx.institution.id;
			// Scope by the most specific filter; unfiltered listings are for
			// institution-wide readers only.
			if (input.studentId) {
				await assertCanReadStudent(actor, input.studentId, institutionId);
			} else if (input.classCourseId) {
				await assertCanReadClassCourse(
					actor,
					input.classCourseId,
					institutionId,
				);
			} else if (input.courseId) {
				await assertCanReadCourse(actor, input.courseId, institutionId);
			} else if (!hasInstitutionWideRecordAccess(actor.memberRole)) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}
			return service.list(input, institutionId);
		}),
});
