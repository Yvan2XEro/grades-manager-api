import { z } from "zod";

export const gradeValidationSchema = z.object({
	examId: z.string().uuid(),
	approverId: z.string().uuid().optional(),
});

export const enrollmentWindowSchema = z.object({
	classId: z.string().uuid(),
	academicYearId: z.string().uuid(),
	action: z.enum(["open", "close"]),
});

export const attendanceAlertSchema = z.object({
	classCourseId: z.string().uuid(),
	severity: z.enum(["info", "warning", "critical"]).default("info"),
	message: z.string().min(3),
	recipientId: z.string().uuid().optional(),
});
