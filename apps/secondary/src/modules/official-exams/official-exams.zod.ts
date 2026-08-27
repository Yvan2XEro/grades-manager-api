import { z } from "zod";

export const createSessionSchema = z.object({
	academicYearId: z.string().uuid(),
	examType: z.enum(["BEPC", "PROBATOIRE", "BAC"]),
	sessionYear: z.number().int().min(1900).max(2100),
	centerCode: z.string().max(30).optional(),
	registrationDeadline: z.string().datetime().optional(),
});

export const listSessionsSchema = z.object({
	academicYearId: z.string().uuid().optional(),
	examType: z.enum(["BEPC", "PROBATOIRE", "BAC"]).optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
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
	isAdmitted: z.boolean().optional(),
	mention: z.string().max(30).optional(),
});

export const listCandidatesSchema = z.object({
	examSessionId: z.string().uuid(),
	isEligible: z.boolean().optional(),
	isAdmitted: z.boolean().optional(),
});

export const idSchema = z.object({ id: z.string().uuid() });
