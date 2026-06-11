import { z } from "zod";
import {
	academicYearTransitionItemStatuses,
	academicYearTransitionOutcomes,
	academicYearTransitionStatuses,
} from "@/db/schema/app-schema";

export const transitionIdSchema = z.object({ id: z.string().min(1) });

export const createTransitionSchema = z.object({
	sourceAcademicYearId: z.string().min(1),
	targetAcademicYearId: z.string().min(1),
	classIds: z.array(z.string().min(1)).default([]),
	deferredOutcome: z.enum(["repeat", "review"]).default("review"),
});

export const listTransitionsSchema = z.object({
	status: z.enum(academicYearTransitionStatuses).optional(),
	cursor: z.string().optional(),
	limit: z.number().int().min(1).max(100).default(20),
});

export const listTransitionItemsSchema = z.object({
	transitionId: z.string().min(1),
	outcome: z.enum(academicYearTransitionOutcomes).optional(),
	status: z.enum(academicYearTransitionItemStatuses).optional(),
	query: z.string().trim().max(120).optional(),
	cursor: z.string().optional(),
	limit: z.number().int().min(1).max(100).default(50),
});

export const resolveTransitionItemSchema = z.object({
	transitionId: z.string().min(1),
	itemId: z.string().min(1),
	outcome: z.enum(academicYearTransitionOutcomes).exclude(["review"]),
	targetClassId: z.string().min(1).nullable().optional(),
	reason: z.string().trim().min(5).max(500),
});

export type CreateTransitionInput = z.infer<typeof createTransitionSchema>;
export type ListTransitionsInput = z.infer<typeof listTransitionsSchema>;
export type ListTransitionItemsInput = z.infer<
	typeof listTransitionItemsSchema
>;
export type ResolveTransitionItemInput = z.infer<
	typeof resolveTransitionItemSchema
>;
