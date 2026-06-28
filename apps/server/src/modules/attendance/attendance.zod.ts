import { z } from "zod";

export const createSessionSchema = z.object({
	classCourseId: z.string(),
	sessionDate: z.string().date(),
	courseSessionId: z.string().optional(),
	isExceptional: z.boolean().optional(),
	notes: z.string().optional(),
});

export const listSessionsSchema = z.object({
	classCourseId: z.string().optional(),
	academicYearId: z.string().optional(),
	dateFrom: z.string().date().optional(),
	dateTo: z.string().date().optional(),
});

export const getSessionSchema = z.object({
	id: z.string(),
});

export const bulkMarkSchema = z.object({
	attendanceSessionId: z.string(),
	records: z.array(
		z.object({
			studentId: z.string(),
			// excused is not allowed here — must go through excuseAbsence
			status: z.enum(["present", "absent", "late"]),
		}),
	),
});

export const updateRecordSchema = z.object({
	attendanceSessionId: z.string(),
	studentId: z.string(),
	// excused is not allowed here — must go through excuseAbsence
	status: z.enum(["present", "absent", "late"]),
});

export const excuseAbsenceSchema = z.object({
	attendanceRecordId: z.string(),
	excuseReason: z.string().min(1),
	approve: z.boolean().default(true),
});

export const attendanceRatesSchema = z.object({
	classCourseId: z.string(),
	academicYearId: z.string().optional(),
});

export const deleteSessionSchema = z.object({
	id: z.string(),
});

export const eligibilityCheckSchema = z.object({
	studentId: z.string(),
	classCourseId: z.string(),
});

export const setThresholdSchema = z.object({
	classCourseId: z.string(),
	threshold: z.number().int().min(0).max(100).nullable(),
});
