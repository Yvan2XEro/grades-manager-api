import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { useQueryState } from "nuqs";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { AuthIconHeader } from "../components/auth-icon-header";
import { AuthSubmitButton } from "../components/auth-submit-button";
import { BackToLoginLink } from "../components/back-to-login-link";
import { FieldError } from "../components/field-error";
import { ResetPasswordSuccess } from "../components/reset-password-success";
import {
	buildResetPasswordSchema,
	type ResetPasswordFormData,
} from "../services/auth-schemas";

const ResetPassword: React.FC = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token") || "";
	const { t } = useTranslation();
	const schema = React.useMemo(() => buildResetPasswordSchema(t), [t]);
	const [success, setSuccess] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ResetPasswordFormData>({ resolver: zodResolver(schema) });

	const [callbackURL] = useQueryState("return", {});

	const onSubmit = async (data: ResetPasswordFormData) => {
		const result = await authClient.resetPassword({
			token,
			newPassword: data.password,
		});

		if (result.error) {
			toast.error(result.error.message || t("auth.reset.error"));
		} else {
			setSuccess(true);
		}
	};

	if (success) return <ResetPasswordSuccess />;

	return (
		<motion.div variants={staggerContainer} initial="hidden" animate="visible">
			<AuthIconHeader
				icon={KeyRound}
				title={t("auth.reset.title")}
				subtitle={t("auth.reset.subtitle", {
					defaultValue: "Choose a strong password for your account.",
				})}
			/>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<motion.div variants={staggerItem} className="space-y-2">
					<Label htmlFor="password">{t("auth.reset.newPassword")}</Label>
					<PasswordInput
						id="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.reset.passwordPlaceholder")}
					/>
					<FieldError message={errors.password?.message} />
				</motion.div>

				<motion.div variants={staggerItem} className="space-y-2">
					<Label htmlFor="confirmPassword">
						{t("common.fields.confirmPassword")}
					</Label>
					<PasswordInput
						id="confirmPassword"
						{...register("confirmPassword")}
						className="h-11"
						placeholder={t("auth.reset.confirmPasswordPlaceholder")}
					/>
					<FieldError message={errors.confirmPassword?.message} />
				</motion.div>

				<motion.div variants={staggerItem}>
					<AuthSubmitButton
						isSubmitting={isSubmitting}
						label={t("auth.reset.submit")}
						submittingLabel={t("auth.reset.submitting")}
					/>
				</motion.div>

				<BackToLoginLink
					callbackURL={callbackURL}
					label={t("auth.reset.backToLogin")}
				/>
			</form>
		</motion.div>
	);
};

export default ResetPassword;
