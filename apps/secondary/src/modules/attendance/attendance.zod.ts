import { z } from "zod";

const STATUSES = ["present", "absent", "late", "excused"] as const;

// ─── Session schemas ─────────────────────────────────────────────────────────

export const createSessionSchema = z.object({
	classId: z.string().uuid(),
	subjectId: z.string().uuid().optional(),
	termId: z.string().uuid(),
	conductedById: z.string().uuid().optional(),
	sessionDate: z.coerce.date(),
	startTime: z.string().max(10).optional(), // "08:00"
	endTime: z.string().max(10).optional(), // "09:30"
});

export const listSessionsSchema = z.object({
	classId: z.string().uuid(),
	termId: z.string().uuid().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

export const getSessionSchema = z.object({
	sessionId: z.string().uuid(),
});

// ─── Record schemas ──────────────────────────────────────────────────────────

export const recordSchema = z.object({
	sessionId: z.string().uuid(),
	studentId: z.string().uuid(),
	status: z.enum(STATUSES as unknown as [string, ...string[]]),
	justification: z.string().max(500).optional(),
});

export const batchRecordSchema = z.object({
	sessionId: z.string().uuid(),
	items: z
		.array(
			z.object({
				studentId: z.string().uuid(),
				status: z.enum(STATUSES as unknown as [string, ...string[]]),
				justification: z.string().max(500).optional(),
			}),
		)
		.min(1)
		.max(100),
});

export const updateRecordSchema = z.object({
	recordId: z.string().uuid(),
	status: z.enum(STATUSES as unknown as [string, ...string[]]).optional(),
	justification: z.string().max(500).optional(),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

export const studentHistorySchema = z.object({
	studentId: z.string().uuid(),
	classId: z.string().uuid().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

export const sessionRecordsSchema = z.object({
	sessionId: z.string().uuid(),
});
