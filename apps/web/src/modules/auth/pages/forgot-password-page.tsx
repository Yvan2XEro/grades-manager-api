import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useQueryState } from "nuqs";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { AuthIconHeader } from "../components/auth-icon-header";
import { AuthSubmitButton } from "../components/auth-submit-button";
import { BackToLoginLink } from "../components/back-to-login-link";
import { FieldError } from "../components/field-error";
import {
	buildForgotPasswordSchema,
	type ForgotPasswordFormData,
} from "../services/auth-schemas";

const ForgotPassword: React.FC = () => {
	const { t } = useTranslation();
	const [callbackURL] = useQueryState("return", {});
	const schema = React.useMemo(() => buildForgotPasswordSchema(t), [t]);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ForgotPasswordFormData>({ resolver: zodResolver(schema) });

	const onSubmit = async (data: ForgotPasswordFormData) => {
		const result = await authClient.forgetPassword({
			email: data.email,
			redirectTo: `${window.location.origin}/auth/reset?return=${callbackURL}`,
		});

		if (result.error) {
			toast.error(result.error.message || t("auth.forgot.error"));
		} else {
			toast.success(t("auth.forgot.success"));
		}
	};

	return (
		<motion.div variants={staggerContainer} initial="hidden" animate="visible">
			<AuthIconHeader
				icon={Mail}
				title={t("auth.forgot.title")}
				subtitle={t("auth.forgot.subtitle", {
					defaultValue:
						"Enter your email and we'll send you a link to reset your password.",
				})}
			/>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<motion.div variants={staggerItem} className="space-y-2">
					<Label htmlFor="email">{t("common.fields.email")}</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="h-11"
						placeholder={t("auth.forgot.emailPlaceholder")}
					/>
					<FieldError message={errors.email?.message} />
				</motion.div>

				<motion.div variants={staggerItem}>
					<AuthSubmitButton
						isSubmitting={isSubmitting}
						label={t("auth.forgot.submit")}
						submittingLabel={t("auth.forgot.submitting")}
					/>
				</motion.div>

				<BackToLoginLink
					callbackURL={callbackURL}
					label={t("auth.forgot.backToLogin")}
				/>
			</form>
		</motion.div>
	);
};

export default ForgotPassword;
