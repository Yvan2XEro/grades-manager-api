import { z } from "zod";

export const examSessionTypes = ["normal", "retake"] as const;
export const retakeScoringPolicies = ["replace", "best_of"] as const;

export const baseSchema = z.object({
	name: z.string(),
	type: z.string(),
	date: z.coerce.date(),
	percentage: z.number(),
	classCourseId: z.string(),
	sessionType: z.enum(examSessionTypes).optional().default("normal"),
	parentExamId: z.string().nullish(),
	scoringPolicy: z.enum(retakeScoringPolicies).optional().default("replace"),
});

export const updateSchema = baseSchema.partial().extend({ id: z.string() });

export const listSchema = z.object({
	classCourseId: z.string().optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	academicYearId: z.string().optional(),
	query: z.string().trim().min(1).optional(),
	classId: z.string().optional(),
	ueSemester: z.enum(["fall", "spring", "annual"]).optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const lockSchema = z.object({ examId: z.string(), lock: z.boolean() });

export const submitSchema = z.object({ examId: z.string() });

export const validateSchema = z.object({
	examId: z.string(),
	status: z.enum(["approved", "rejected"]),
});

export const retakeEligibilitySchema = z.object({
	examId: z.string(),
});

export const retakeOverrideSchema = z.object({
	examId: z.string(),
	studentCourseEnrollmentId: z.string(),
	decision: z.enum(["force_eligible", "force_ineligible"]),
	reason: z.string().trim().min(1),
});

export const deleteRetakeOverrideSchema = retakeOverrideSchema.pick({
	examId: true,
	studentCourseEnrollmentId: true,
});

export const createRetakeSchema = z.object({
	parentExamId: z.string(),
	name: z.string().optional(),
	date: z.coerce.date(),
	scoringPolicy: z.enum(retakeScoringPolicies).optional().default("replace"),
});
