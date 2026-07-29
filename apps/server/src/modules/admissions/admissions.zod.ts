import { z } from "zod";
import {
	admissionApplicationStatuses,
	admissionDocumentStatuses,
} from "@/db/schema/app-schema";

export const applicantProfileSchema = z.object({
	// Core
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	email: z.string().email(),
	phone: z.string().max(30).nullish(),
	dateOfBirth: z.string().nullish(),
	nationality: z.string().max(80).nullish(),
	previousDiploma: z.string().max(200).nullish(),
	previousInstitution: z.string().max(200).nullish(),

	// Extended identity
	gender: z.string().max(20).nullish(),
	placeOfBirth: z.string().max(150).nullish(),
	countryOfBirth: z.string().max(80).nullish(),
	exactDateOfBirth: z.boolean().default(true),
	idCardNumber: z.string().max(50).nullish(),
	maritalStatus: z.string().max(30).nullish(),
	employmentStatus: z.string().max(50).nullish(),
	primaryLanguage: z.string().max(30).nullish(),
	hasDisability: z.boolean().default(false),
	photoUrl: z.string().max(500).nullish(),

	// Contact extensions
	whatsapp: z.string().max(30).nullish(),
	address: z.string().max(300).nullish(),
	city: z.string().max(100).nullish(),
	postalBox: z.string().max(20).nullish(),

	// Geographic origin
	originCountry: z.string().max(80).nullish(),
	originRegion: z.string().max(100).nullish(),
	originDepartment: z.string().max(100).nullish(),
	studentStatus: z.string().max(30).nullish(),

	// Entry diploma
	entryDiplomaType: z.string().max(50).nullish(),
	bacSeries: z.string().max(20).nullish(),
	bacYear: z.string().max(4).nullish(),
	bacMention: z.string().max(30).nullish(),
	bacAverage: z.string().max(10).nullish(),
	bacInstitution: z.string().max(200).nullish(),
	bacCountry: z.string().max(80).nullish(),
	bacMatricule: z.string().max(50).nullish(),

	// Prior higher education
	hasPriorHigherEd: z.boolean().default(false),
	priorInstitution: z.string().max(200).nullish(),
	priorField: z.string().max(200).nullish(),
	priorLevel: z.string().max(20).nullish(),
	priorStartYear: z.string().max(4).nullish(),
	priorEndYear: z.string().max(4).nullish(),
	priorResult: z.string().max(30).nullish(),

	// Family
	fatherName: z.string().max(150).nullish(),
	fatherProfession: z.string().max(150).nullish(),
	fatherPhone: z.string().max(30).nullish(),
	fatherAlive: z.boolean().nullish(),
	motherName: z.string().max(150).nullish(),
	motherProfession: z.string().max(150).nullish(),
	motherPhone: z.string().max(30).nullish(),
	motherAlive: z.boolean().nullish(),
	guardianName: z.string().max(150).nullish(),
	guardianRelation: z.string().max(100).nullish(),
	guardianPhone: z.string().max(30).nullish(),

	// Emergency contact
	emergencyContactName: z.string().max(150).nullish(),
	emergencyContactPhone: z.string().max(30).nullish(),
	emergencyContactCity: z.string().max(100).nullish(),
});

export const submitApplicationSchema = z.object({
	applicant: applicantProfileSchema,
	programId: z.string().uuid(),
	secondChoiceProgramId: z.string().uuid().nullish(),
	thirdChoiceProgramId: z.string().uuid().nullish(),
	classId: z.string().uuid().nullish(),
	academicYearId: z.string().uuid(),
	academicLevel: z.string().max(20).nullish(),
	trainingType: z.string().max(30).nullish(),
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
	search: z.string().max(100).nullish(),
	limit: z.number().int().min(1).max(100).default(25),
	offset: z.number().int().min(0).default(0),
});
