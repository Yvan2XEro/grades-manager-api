import type { TFunction } from "i18next";
import { z } from "zod";
import i18n from "@/i18n";

export const ASSIGNABLE_ROLES = [
	"administrator",
	"dean",
	"teacher",
	"grade_editor",
	"staff",
	"student",
] as const;

type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

const isAssignableRole = (role: string): role is AssignableRole =>
	(ASSIGNABLE_ROLES as readonly string[]).includes(role);

export const roleLabel = (t: TFunction, role?: string | null) =>
	role && isAssignableRole(role) ? t(`admin.users.roles.${role}`) : role;

export const createAccountSchema = z.object({
	email: z.string().email({
		error: () => i18n.t("usersHub.account.validation.emailInvalid"),
	}),
	password: z.string().min(8, {
		error: () => i18n.t("usersHub.account.validation.passwordMin"),
	}),
	memberRole: z.string().min(1, {
		error: () => i18n.t("usersHub.account.validation.roleRequired"),
	}),
});

export const linkAccountSchema = z.object({
	authEmail: z.string().email({
		error: () => i18n.t("usersHub.account.validation.emailInvalid"),
	}),
});

export type CreateAccountValues = z.infer<typeof createAccountSchema>;
export type LinkAccountValues = z.infer<typeof linkAccountSchema>;

export const createAccountErrorMessage = (err: Error) =>
	err.message.includes("already exists")
		? i18n.t("usersHub.account.errors.emailExists")
		: i18n.t("usersHub.account.errors.createFailed");

export const linkAccountErrorMessage = (err: Error) =>
	err.message.includes("not a member")
		? i18n.t("usersHub.account.errors.notMember")
		: err.message.includes("already linked")
			? i18n.t("usersHub.account.errors.alreadyLinked")
			: i18n.t("usersHub.account.errors.linkFailed");
