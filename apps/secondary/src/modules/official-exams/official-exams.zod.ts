import { z } from "zod";

const _BAC_SERIES = ["A4", "C", "D", "TI", "F3", "F4", "A5"] as const;

export const createSessionSchema = z.object({
	academicYearId: z.string().uuid(),
	examType: z.enum(["BEPC", "PROBATOIRE", "BAC"]),
	series: z.string().max(10).optional(), // required for BAC/PROBATOIRE
	sessionYear: z.number().int().min(1900).max(2100),
	centerCode: z.string().max(30).optional(),
	registrationDeadline: z.string().datetime().optional(),
});

export const listSessionsSchema = z.object({
	academicYearId: z.string().uuid().optional(),
	examType: z.enum(["BEPC", "PROBATOIRE", "BAC"]).optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(500).default(25),
});

export const registerCandidateSchema = z.object({
	examSessionId: z.string().uuid(),
	enrollmentId: z.string().uuid(),
	candidateNumber: z.string().max(30).optional(),
	isEligible: z.boolean().optional().default(true),
	hasPaidFee: z.boolean().optional().default(false),
});

export const updateRegistrationSchema = z.object({
	id: z.string().uuid(),
	candidateNumber: z.string().max(30).optional(),
	isEligible: z.boolean().optional(),
	hasPaidFee: z.boolean().optional(),
	feeAmount: z.number().positive().optional().nullable(),
	feePaidAt: z.string().datetime().optional().nullable(),
	feeTransactionRef: z.string().max(100).optional().nullable(),
	isAdmitted: z.boolean().optional(),
	mention: z.string().max(30).optional(),
});

export const updateSessionSchema = z.object({
	id: z.string().uuid(),
	series: z.string().max(10).optional().nullable(),
	centerCode: z.string().max(30).optional().nullable(),
	registrationDeadline: z.string().datetime().optional().nullable(),
	sessionYear: z.number().int().min(1900).max(2100).optional(),
});

export const listCandidatesSchema = z.object({
	examSessionId: z.string().uuid(),
	isEligible: z.boolean().optional(),
	isAdmitted: z.boolean().optional(),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const bulkRegisterSchema = z.object({
	examSessionId: z.string().uuid(),
	classId: z.string().uuid(),
});

export const checkEligibilitySchema = z.object({
	registrationId: z.string().uuid(),
	// Minimum annual average required (default: 8/20 — MINESEC threshold)
	minAverage: z.number().min(0).max(20).optional().default(8),
});

export const printEligibilityListSchema = z.object({
	examSessionId: z.string().uuid(),
});

export const printCandidateListSchema = z.object({
	examSessionId: z.string().uuid(),
});
