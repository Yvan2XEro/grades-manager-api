import { z } from "zod";
import {
	admissionApplicationStatuses,
	admissionDocumentStatuses,
} from "@/db/schema/app-schema";

export const applicantProfileSchema = z.object({
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	email: z.string().email(),
	phone: z.string().max(30).nullish(),
	dateOfBirth: z.string().nullish(),
	nationality: z.string().max(80).nullish(),
	previousDiploma: z.string().max(200).nullish(),
	previousInstitution: z.string().max(200).nullish(),
});

export const submitApplicationSchema = z.object({
	applicant: applicantProfileSchema,
	programId: z.string().uuid(),
	classId: z.string().uuid().nullish(),
	academicYearId: z.string().uuid(),
	personalStatement: z.string().max(3000).nullish(),
});

export const reviewApplicationSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(["accepted", "rejected", "waitlisted"]),
	reviewNotes: z.string().max(2000).nullish(),
});

export const convertApplicationSchema = z.object({
	id: z.string().uuid(),
	classId: z.string().uuid().nullish(),
	registrationNumber: z.string().min(1).max(100).nullish(),
	registrationFormatId: z.string().uuid().nullish(),
});

export const upsertRequirementSchema = z.object({
	id: z.string().uuid().nullish(),
	programId: z.string().uuid().nullish(),
	code: z.string().min(1).max(80),
	label: z.string().min(1).max(200),
	description: z.string().max(1000).nullish(),
	isRequired: z.boolean().default(true),
	allowedMimeTypes: z.array(z.string().min(1).max(120)).default([]),
	maxSizeBytes: z.number().int().positive().nullish(),
	isActive: z.boolean().default(true),
});

export const listRequirementsSchema = z.object({
	programId: z.string().uuid().nullish(),
	includeInactive: z.boolean().default(false),
});

export const submitDocumentSchema = z.object({
	applicationId: z.string().uuid(),
	requirementId: z.string().uuid().nullish(),
	code: z.string().min(1).max(80),
	label: z.string().min(1).max(200),
	fileName: z.string().min(1).max(255),
	fileUrl: z.string().min(1).max(2000),
	mimeType: z.string().max(120).nullish(),
	sizeBytes: z.number().int().nonnegative().nullish(),
});

export const reviewDocumentSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(admissionDocumentStatuses),
	reviewNotes: z.string().max(2000).nullish(),
});

export const listApplicationsSchema = z.object({
	status: z
		.enum(admissionApplicationStatuses as unknown as [string, ...string[]])
		.nullish(),
	programId: z.string().uuid().nullish(),
	academicYearId: z.string().uuid().nullish(),
	limit: z.number().int().min(1).max(100).default(50),
	offset: z.number().int().min(0).default(0),
});
