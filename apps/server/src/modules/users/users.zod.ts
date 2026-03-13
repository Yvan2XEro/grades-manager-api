import { z } from "zod";
import { domainStatuses, genders } from "@/db/schema/app-schema";

const profileSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email(),
	phone: z.string().optional(),
	dateOfBirth: z.coerce.date().optional(),
	placeOfBirth: z.string().optional(),
	gender: z.enum(genders).optional(),
	nationality: z.string().optional(),
	status: z.enum(domainStatuses).optional(),
});

export const createUserProfileSchema = profileSchema.extend({
	authUserId: z.string().optional(),
	memberId: z.string().optional(),
});

export const updateUserProfileSchema = profileSchema
	.partial()
	.extend({
		id: z.string(),
		authUserId: z.string().optional(),
		memberId: z.string().optional(),
	})
	.refine(
		(value) =>
			value.firstName ||
			value.lastName ||
			value.email ||
			value.phone ||
			value.dateOfBirth ||
			value.placeOfBirth ||
			value.gender ||
			value.nationality ||
			value.status ||
			value.authUserId ||
			value.memberId,
		{ message: "Missing fields to update" },
	);

export const updateMyProfileSchema = z
	.object({
		firstName: z.string().min(1).optional(),
		lastName: z.string().min(1).optional(),
		phone: z.string().nullable().optional(),
		dateOfBirth: z.coerce.date().nullable().optional(),
		placeOfBirth: z.string().nullable().optional(),
		gender: z.enum(genders).optional(),
		nationality: z.string().nullable().optional(),
	})
	.refine(
		(value) =>
			value.firstName !== undefined ||
			value.lastName !== undefined ||
			value.phone !== undefined ||
			value.dateOfBirth !== undefined ||
			value.placeOfBirth !== undefined ||
			value.gender !== undefined ||
			value.nationality !== undefined,
		{ message: "At least one field must be provided" },
	);
