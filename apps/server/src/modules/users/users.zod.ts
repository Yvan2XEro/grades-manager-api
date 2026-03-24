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

/**
 * Roles an admin can assign when creating a user with system access.
 * Excludes privileged system roles (guest, owner) not intended for manual assignment.
 */
export const assignableMemberRoles = [
	"administrator",
	"dean",
	"teacher",
	"grade_editor",
	"staff",
	"student",
] as const;

export type AssignableMemberRole = (typeof assignableMemberRoles)[number];

/**
 * Schema for creating a user, optionally with a Better-Auth account and org membership.
 * When canConnect=true, password and memberRole are required.
 */
export const createUserWithAuthSchema = z
	.object({
		...profileSchema.shape,
		canConnect: z.boolean().default(false),
		password: z.string().min(8).optional(),
		memberRole: z
			.enum(assignableMemberRoles as unknown as [string, ...string[]])
			.optional(),
	})
	.superRefine((data, ctx) => {
		if (!data.canConnect) return;
		if (!data.password || data.password.length < 8) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["password"],
				message: "Password must be at least 8 characters",
			});
		}
		if (!data.memberRole) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["memberRole"],
				message: "Role is required when system access is enabled",
			});
		}
	});

export type CreateUserWithAuthInput = z.infer<typeof createUserWithAuthSchema>;

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
