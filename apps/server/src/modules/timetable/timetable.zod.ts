import { z } from "zod";
import { daysOfWeek } from "@/db/schema/app-schema";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const validitySchema = z
	.object({
		validFrom: z.string().regex(datePattern).optional(),
		validUntil: z.string().regex(datePattern).optional(),
	})
	.refine(
		(data) =>
			!data.validFrom || !data.validUntil || data.validFrom <= data.validUntil,
		{
			message: "validFrom must be before or equal to validUntil",
			path: ["validUntil"],
		},
	);

export const createSessionSchema = z
	.object({
		classCourseId: z.string().min(1),
		academicYearId: z.string().min(1),
		dayOfWeek: z.enum(daysOfWeek as unknown as [string, ...string[]]),
		startTime: z.string().regex(timePattern, "HH:MM format required"),
		endTime: z.string().regex(timePattern, "HH:MM format required"),
		room: z.string().optional(),
		roomId: z.string().optional(),
		semesterId: z.string().optional(),
	})
	.and(validitySchema);

export const updateSessionSchema = z
	.object({
		id: z.string().min(1),
		dayOfWeek: z
			.enum(daysOfWeek as unknown as [string, ...string[]])
			.optional(),
		startTime: z.string().regex(timePattern).optional(),
		endTime: z.string().regex(timePattern).optional(),
		room: z.string().nullish(),
		roomId: z.string().nullish(),
		semesterId: z.string().nullish(),
		validFrom: z.string().regex(datePattern).nullish(),
		validUntil: z.string().regex(datePattern).nullish(),
	})
	.refine(
		(data) =>
			!data.validFrom || !data.validUntil || data.validFrom <= data.validUntil,
		{
			message: "validFrom must be before or equal to validUntil",
			path: ["validUntil"],
		},
	);

export const deleteSessionSchema = z.object({ id: z.string().min(1) });

export const listSessionsSchema = z.object({
	classCourseId: z.string().optional(),
	classId: z.string().optional(),
	teacherId: z.string().optional(),
	academicYearId: z.string().optional(),
	semesterId: z.string().optional(),
	dayOfWeek: z.enum(daysOfWeek as unknown as [string, ...string[]]).optional(),
});

const importRowSchema = z.object({
	id: z.string().optional(),
	classCourseId: z.string(),
	dayOfWeek: z.string(),
	startTime: z.string(),
	endTime: z.string(),
	room: z.string().optional(),
	roomId: z.string().optional(),
	semesterId: z.string().optional(),
	validFrom: z.string().regex(datePattern).optional(),
	validUntil: z.string().regex(datePattern).optional(),
});

export const previewBulkImportSchema = z.object({
	rows: z.array(importRowSchema).min(1).max(500),
	mode: z.enum(["create", "update"]).default("create"),
});

export const executeBulkImportSchema = z.object({
	rows: z.array(importRowSchema).min(1).max(500),
	skipDuplicates: z.boolean().default(true),
	mode: z.enum(["create", "update"]).default("create"),
});
