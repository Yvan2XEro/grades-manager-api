import z from "zod";
import { genders } from "@/db/schema/app-schema";

const genderEnum = z.enum(genders);

export const profileSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email(),
	dateOfBirth: z.coerce.date(),
	placeOfBirth: z.string().min(1),
	gender: genderEnum,
	phone: z.string().optional(),
	nationality: z.string().optional(),
	authUserId: z.string().optional(),
});

export const baseSchema = z.object({
	classId: z.string(),
	registrationNumber: z.string(),
	profile: profileSchema,
});

export const updateSchema = z.object({
	id: z.string(),
	classId: z.string().optional(),
	registrationNumber: z.string().optional(),
	profile: profileSchema.partial().optional(),
});

export const listSchema = z.object({
	classId: z.string().optional(),
	q: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const idSchema = z.object({ id: z.string() });

export const bulkCreateSchema = z.object({
	classId: z.string(),
	students: z.array(
		profileSchema.extend({
			registrationNumber: z.string(),
		}),
	),
});
