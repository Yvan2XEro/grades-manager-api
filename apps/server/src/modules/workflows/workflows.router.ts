import { TRPCError } from "@trpc/server";
import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./workflows.service";
import {
	attendanceAlertSchema,
	cohortAnalyticsSchema,
	enrollmentWindowSchema,
	gradeRejectionSchema,
	gradeValidationSchema,
	studentSelfEnrollSchema,
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

	rejectGrades: tenantAdminProcedure
		.input(gradeRejectionSchema)
		.mutation(({ ctx, input }) =>
			service.rejectGrades(
				input.examId,
				input.reason,
				ctx.profile?.id,
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

	// ── Student self-enrollment ───────────────────────────────────────────────
	studentSelfEnroll: tenantProtectedProcedure
		.input(studentSelfEnrollSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.profile) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Profile required",
				});
			}
			return service.studentSelfEnroll(
				ctx.profile.id,
				input.classCourseId,
				ctx.institution.id,
			);
		}),

	studentSelfUnenroll: tenantProtectedProcedure
		.input(studentSelfEnrollSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.profile) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Profile required",
				});
			}
			return service.studentSelfUnenroll(
				ctx.profile.id,
				input.classCourseId,
				ctx.institution.id,
			);
		}),

	// ── Student deliberation decision ─────────────────────────────────────────
	myDecisions: tenantProtectedProcedure.query(({ ctx }) => {
		if (!ctx.profile) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Profile required",
			});
		}
		return service.getStudentDecision(ctx.profile.id, ctx.institution.id);
	}),

	// ── Dean cohort analytics ─────────────────────────────────────────────────
	cohortAnalytics: tenantAdminProcedure
		.input(cohortAnalyticsSchema)
		.query(({ ctx, input }) =>
			service.getCohortAnalytics(ctx.institution.id, input),
		),
});
