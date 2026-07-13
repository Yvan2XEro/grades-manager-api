import { z } from "zod";
import {
	guardianCommunicationTypes,
	guardianRelationshipTypes,
} from "@/db/schema/app-schema";

export const communicationPreferencesSchema = z.object({
	resultsPublished: z.boolean().optional(),
	attendanceThreshold: z.boolean().optional(),
	feeClearance: z.boolean().optional(),
	documentsAvailable: z.boolean().optional(),
});

export const createGuardianSchema = z.object({
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	email: z.string().email(),
	phone: z.string().max(40).nullish(),
	relationshipType: z.enum(guardianRelationshipTypes),
	studentId: z.string().uuid(),
	isPrimary: z.boolean().default(false),
	isEmergencyContact: z.boolean().default(false),
	preferences: communicationPreferencesSchema.optional(),
});

export const linkStudentSchema = z.object({
	guardianId: z.string().uuid(),
	studentId: z.string().uuid(),
	relationshipType: z.enum(guardianRelationshipTypes),
	isPrimary: z.boolean().default(false),
	isEmergencyContact: z.boolean().default(false),
});

export const updatePreferencesSchema = z.object({
	guardianId: z.string().uuid(),
	preferences: communicationPreferencesSchema,
});

export const studentIdSchema = z.object({
	studentId: z.string().uuid(),
});

export const portalSchema = z.object({
	accessToken: z.string().min(16),
});

export const recordCommunicationEventSchema = z.object({
	guardianId: z.string().uuid(),
	studentId: z.string().uuid(),
	type: z.enum(guardianCommunicationTypes),
	channel: z.string().min(1).max(80),
	payload: z.record(z.string(), z.unknown()).default({}),
});

export const listAllSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(25),
	search: z.string().optional(),
});

export const removeLinkSchema = z.object({
	studentId: z.string(),
	guardianId: z.string(),
});

export const deleteGuardianSchema = z.object({
	id: z.string(),
});
