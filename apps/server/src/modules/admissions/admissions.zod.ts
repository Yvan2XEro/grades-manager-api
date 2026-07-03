import { z } from "zod";
import { admissionApplicationStatuses } from "@/db/schema/app-schema";

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

export const listApplicationsSchema = z.object({
	status: z
		.enum(admissionApplicationStatuses as unknown as [string, ...string[]])
		.nullish(),
	programId: z.string().uuid().nullish(),
	academicYearId: z.string().uuid().nullish(),
	limit: z.number().int().min(1).max(100).default(50),
	offset: z.number().int().min(0).default(0),
});
