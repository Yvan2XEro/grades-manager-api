import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useQueryState } from "nuqs";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { authClient } from "@/lib/auth-client";
import { detectOrganizationSlug } from "@/lib/organization";
import { toast } from "@/lib/toast";
import { AuthSubmitButton } from "../components/auth-submit-button";
import { FieldError } from "../components/field-error";
import {
	buildRegisterSchema,
	type RegisterFormData,
} from "../services/auth-schemas";

const Register: React.FC = () => {
	const navigate = useNavigate();
	const [callbackURL] = useQueryState("return", {});
	const { t } = useTranslation();
	const registerSchema = React.useMemo(() => buildRegisterSchema(t), [t]);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});

	const onSubmit = async (data: RegisterFormData) => {
		const signUpResult = await authClient.signUp.email({
			email: data.email,
			password: data.password,
			name: `${data.firstName} ${data.lastName}`,
		});

		if (signUpResult.error) {
			toast.error(signUpResult.error.message || t("auth.register.error"));
			return;
		}

		let slug: string | undefined;
		try {
			slug = detectOrganizationSlug();
		} catch {
			// No slug available
		}

		const signInResult = await authClient.signIn.email({
			email: data.email,
			password: data.password,
			callbackURL: callbackURL || undefined,
			fetchOptions: slug
				? { headers: { "X-Organization-Slug": slug } }
				: undefined,
		});

		if (signInResult.error) {
			toast.error(signInResult.error.message || t("auth.login.error"));
			return;
		}

		toast.success(t("auth.register.success"));
		navigate(callbackURL || "/");
	};

	return (
		<motion.div variants={staggerContainer} initial="hidden" animate="visible">
			<motion.div variants={staggerItem} className="mb-8">
				<h2 className="text-foreground">{t("auth.register.title")}</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.register.haveAccount")}{" "}
					<Link
						to={`/auth/login?return=${callbackURL}`}
						className="font-medium text-primary hover:text-primary/80"
					>
						{t("auth.register.loginLink")}
					</Link>
				</p>
			</motion.div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="firstName">{t("common.fields.firstName")}</Label>
						<Input
							id="firstName"
							type="text"
							{...register("firstName")}
							className="h-11"
							placeholder={t("auth.register.placeholders.firstName")}
						/>
						<FieldError message={errors.firstName?.message} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="lastName">{t("common.fields.lastName")}</Label>
						<Input
							id="lastName"
							type="text"
							{...register("lastName")}
							className="h-11"
							placeholder={t("auth.register.placeholders.lastName")}
						/>
						<FieldError message={errors.lastName?.message} />
					</div>
				</motion.div>

				<motion.div variants={staggerItem} className="space-y-2">
					<Label htmlFor="email">{t("common.fields.email")}</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="h-11"
						placeholder={t("auth.register.placeholders.email")}
					/>
					<FieldError message={errors.email?.message} />
				</motion.div>

				<motion.div variants={staggerItem} className="space-y-2">
					<Label htmlFor="password">{t("common.fields.password")}</Label>
					<PasswordInput
						id="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.register.placeholders.password")}
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
						placeholder={t("auth.register.placeholders.confirmPassword")}
					/>
					<FieldError message={errors.confirmPassword?.message} />
				</motion.div>

				<motion.div variants={staggerItem}>
					<AuthSubmitButton
						isSubmitting={isSubmitting}
						label={t("auth.register.submit")}
						submittingLabel={t("auth.register.submitting")}
					/>
				</motion.div>
			</form>
		</motion.div>
	);
};

export default Register;
