import type { TFunction } from "i18next";
import { z } from "zod";

export const buildLoginSchema = (t: TFunction) =>
	z.object({
		email: z.string().email(t("auth.validation.email")),
		password: z.string().min(6, t("auth.validation.passwordMin", { count: 6 })),
		rememberMe: z.boolean().optional(),
	});

export type LoginFormData = z.infer<ReturnType<typeof buildLoginSchema>>;

export const buildRegisterSchema = (t: TFunction) =>
	z
		.object({
			firstName: z.string().min(2, t("auth.validation.firstName")),
			lastName: z.string().min(2, t("auth.validation.lastName")),
			email: z.string().email(t("auth.validation.email")),
			password: z
				.string()
				.min(6, t("auth.validation.passwordMin", { count: 6 })),
			confirmPassword: z.string().min(6, t("auth.validation.confirmPassword")),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t("auth.validation.passwordsMismatch"),
			path: ["confirmPassword"],
		});

export type RegisterFormData = z.infer<ReturnType<typeof buildRegisterSchema>>;

export const buildForgotPasswordSchema = (t: TFunction) =>
	z.object({
		email: z.string().email(t("auth.validation.email")),
	});

export type ForgotPasswordFormData = z.infer<
	ReturnType<typeof buildForgotPasswordSchema>
>;

export const buildResetPasswordSchema = (t: TFunction) =>
	z
		.object({
			password: z
				.string()
				.min(6, t("auth.validation.passwordMin", { count: 6 })),
			confirmPassword: z.string().min(6, t("auth.validation.confirmPassword")),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t("auth.validation.passwordsMismatch"),
			path: ["confirmPassword"],
		});

export type ResetPasswordFormData = z.infer<
	ReturnType<typeof buildResetPasswordSchema>
>;
