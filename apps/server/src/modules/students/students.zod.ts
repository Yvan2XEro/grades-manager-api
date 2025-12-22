import z from "zod";
import { admissionTypes, genders } from "@/db/schema/app-schema";

const genderEnum = z.enum(genders);
const admissionTypeEnum = z.enum(admissionTypes);

export const profileSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email(),
	dateOfBirth: z.coerce.date().optional(),
	placeOfBirth: z.string().optional(),
	gender: genderEnum.optional(),
	phone: z.string().optional(),
	nationality: z.string().optional(),
	authUserId: z.string().optional(),
});

const baseFieldsSchema = z.object({
	classId: z.string(),
	registrationNumber: z.string().min(1).optional(),
});

const createExtrasSchema = z.object({
	registrationFormatId: z.string().optional(),
});

const externalAdmissionFieldsSchema = z.object({
	admissionType: admissionTypeEnum.optional().default("normal"),
	transferInstitution: z.string().optional(),
	transferCredits: z.number().int().min(0).max(300).optional(),
	transferLevel: z.string().optional(),
	admissionJustification: z.string().optional(),
	admissionDate: z.coerce.date().optional(),
});

export const baseSchema = baseFieldsSchema
	.merge(createExtrasSchema)
	.merge(profileSchema)
	.merge(externalAdmissionFieldsSchema);

export const updateSchema = z
	.object({ id: z.string() })
	.merge(baseFieldsSchema.partial())
	.merge(profileSchema.partial())
	.merge(externalAdmissionFieldsSchema.partial());

export const externalAdmissionSchema = profileSchema
	.merge(
		z.object({
			classId: z.string(),
			admissionType: admissionTypeEnum.refine(
				(val) => val !== "normal",
				"Admission type must be transfer, direct, or equivalence",
			),
			transferInstitution: z.string().min(1),
			transferCredits: z.number().int().min(0).max(300),
			transferLevel: z.string().min(1),
			admissionJustification: z.string().min(10),
			admissionDate: z.coerce.date(),
			registrationNumber: z.string().optional(),
			registrationFormatId: z.string().optional(),
		}),
	)
	.strict();

export const listSchema = z.object({
	classId: z.string().optional(),
	q: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const bulkCreateSchema = z.object({
	classId: z.string(),
	registrationFormatId: z.string().optional(),
	students: z.array(
		profileSchema
			.extend({
				registrationNumber: z.string().min(1).optional(),
			})
			.merge(
				externalAdmissionFieldsSchema.pick({
					admissionType: true,
					transferInstitution: true,
					transferCredits: true,
					transferLevel: true,
					admissionJustification: true,
					admissionDate: true,
				}),
			),
	),
});

export type StudentProfilePayload = z.infer<typeof profileSchema>;
