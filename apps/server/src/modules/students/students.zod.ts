import z from "zod";
import { genders } from "@/db/schema/app-schema";

const genderEnum = z.enum(genders);

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

export const baseSchema = baseFieldsSchema
	.merge(createExtrasSchema)
	.merge(profileSchema);

export const updateSchema = z
	.object({ id: z.string() })
	.merge(baseFieldsSchema.partial())
	.merge(profileSchema.partial());

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
		profileSchema.extend({
			registrationNumber: z.string().min(1).optional(),
		}),
	),
});

export type StudentProfilePayload = z.infer<typeof profileSchema>;
