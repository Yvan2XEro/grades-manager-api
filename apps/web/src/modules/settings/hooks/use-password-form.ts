import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";

const buildPasswordSchema = (t: TFunction) =>
	z
		.object({
			currentPassword: z
				.string()
				.min(1, t("settings.password.validation.current")),
			newPassword: z.string().min(8, t("settings.password.validation.new")),
			confirmPassword: z
				.string()
				.min(1, t("settings.password.validation.confirm")),
			revokeOtherSessions: z.boolean().optional(),
		})
		.refine((value) => value.newPassword === value.confirmPassword, {
			message: t("settings.password.validation.match"),
			path: ["confirmPassword"],
		});

type PasswordFormValues = z.infer<ReturnType<typeof buildPasswordSchema>>;

export function usePasswordForm() {
	const { t } = useTranslation();
	const passwordSchema = useMemo(() => buildPasswordSchema(t), [t]);

	const form = useForm<PasswordFormValues>({
		resolver: zodResolver(passwordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
			revokeOtherSessions: false,
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: PasswordFormValues) => {
			const response = await authClient.changePassword({
				currentPassword: values.currentPassword,
				newPassword: values.newPassword,
				revokeOtherSessions: values.revokeOtherSessions ?? false,
			});
			if (
				response &&
				typeof response === "object" &&
				"error" in response &&
				(response as { error?: { message?: string } | null }).error
			) {
				const error = (response as { error?: { message?: string } | null })
					.error;
				throw new Error(error?.message ?? "Password update failed");
			}
			return response;
		},
		onSuccess: () => {
			form.reset();
			toast.success(t("settings.password.toast.success"));
		},
		onError: (error) => {
			const message =
				error instanceof Error
					? error.message
					: t("settings.password.toast.error");
			toast.error(message);
		},
	});

	const submit = form.handleSubmit((values) => mutation.mutate(values));

	return { form, submit, isPending: mutation.isPending };
}
