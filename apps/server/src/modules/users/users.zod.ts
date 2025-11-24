import { z } from "zod";
import { businessRoles, domainStatuses, genders } from "@/db/schema/app-schema";

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
	role: z.enum(businessRoles),
	authUserId: z.string().optional(),
});

export const updateUserProfileSchema = profileSchema
	.partial()
	.extend({
		id: z.string(),
		role: z.enum(businessRoles).optional(),
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
			value.role,
		{ message: "Missing fields to update" },
	);
