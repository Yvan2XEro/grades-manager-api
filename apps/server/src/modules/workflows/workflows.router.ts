import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./workflows.service";
import {
	attendanceAlertSchema,
	enrollmentWindowSchema,
	gradeValidationSchema,
} from "./workflows.zod";

export const workflowsRouter = router({
	validateGrades: tenantAdminProcedure
		.input(gradeValidationSchema)
		.mutation(({ ctx, input }) =>
			service.validateGrades(
				input.examId,
				input.approverId,
				ctx.institution.id,
			),
		),
	enrollmentWindow: tenantAdminProcedure
		.input(enrollmentWindowSchema)
		.mutation(({ ctx, input }) =>
			service.toggleEnrollmentWindow(
				input.classId,
				input.academicYearId,
				input.action,
				ctx.institution.id,
			),
		),
	enrollmentWindows: tenantProtectedProcedure.query(({ ctx }) =>
		service.listEnrollmentWindows(ctx.institution.id),
	),
	attendanceAlert: tenantProtectedProcedure
		.input(attendanceAlertSchema)
		.mutation(({ ctx, input }) =>
			service.triggerAttendanceAlert(
				input.classCourseId,
				input.severity,
				input.message,
				input.recipientId,
				ctx.institution.id,
			),
		),
});
