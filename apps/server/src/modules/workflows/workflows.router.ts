import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./workflows.service";
import {
	attendanceAlertSchema,
	enrollmentWindowSchema,
	gradeValidationSchema,
} from "./workflows.zod";

export const workflowsRouter = router({
	validateGrades: adminProcedure
		.input(gradeValidationSchema)
		.mutation(({ input }) =>
			service.validateGrades(input.examId, input.approverId),
		),
	enrollmentWindow: adminProcedure
		.input(enrollmentWindowSchema)
		.mutation(({ input }) =>
			service.toggleEnrollmentWindow(
				input.classId,
				input.academicYearId,
				input.action,
			),
		),
	enrollmentWindows: protectedProcedure.query(() =>
		service.listEnrollmentWindows(),
	),
	attendanceAlert: protectedProcedure
		.input(attendanceAlertSchema)
		.mutation(({ input }) =>
			service.triggerAttendanceAlert(
				input.classCourseId,
				input.severity,
				input.message,
				input.recipientId,
			),
		),
});
