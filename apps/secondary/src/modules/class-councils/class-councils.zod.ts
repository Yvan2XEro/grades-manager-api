import { z } from "zod";

export const createSchema = z.object({
	classId: z.string().uuid(),
	termId: z.string().uuid(),
	status: z
		.enum(["draft", "scheduled", "held", "signed"])
		.optional()
		.default("draft"),
	presidentId: z.string().uuid().optional(),
	secretaryId: z.string().uuid().optional(),
	scheduledAt: z.string().datetime().optional(),
});

export const listSchema = z.object({
	classId: z.string().uuid().optional(),
	termId: z.string().uuid().optional(),
	status: z.enum(["draft", "scheduled", "held", "signed"]).optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(500).default(25),
});

export const addDecisionSchema = z.object({
	councilId: z.string().uuid(),
	enrollmentId: z.string().uuid(),
	decision: z.string().min(1).max(40),
	note: z.string().max(500).optional(),
});

export const updateDecisionSchema = z.object({
	id: z.string().uuid(),
	decision: z.string().min(1).max(40).optional(),
	note: z.string().max(500).optional(),
});

export const updateCouncilSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(["draft", "scheduled", "held", "signed"]).optional(),
	presidentId: z.string().uuid().optional(),
	secretaryId: z.string().uuid().optional(),
	scheduledAt: z.string().datetime().optional(),
	heldAt: z.string().datetime().optional(),
	pvPath: z.string().optional(),
	globalNote: z.string().optional(),
});

export const idSchema = z.object({ id: z.string().uuid() });
