import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import type { TFunction } from "i18next";
import { Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PasswordInput } from "../../components/ui/password-input";
import { errorMsg, staggerContainer, staggerItem } from "../../lib/animations";
import { authClient } from "../../lib/auth-client";
import { detectOrganizationSlug } from "../../lib/organization";

const buildRegisterSchema = (t: TFunction) =>
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

type RegisterFormData = z.infer<ReturnType<typeof buildRegisterSchema>>;

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
				<h2 className="text-foreground">
					{t("auth.register.title")}
				</h2>
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
						{errors.firstName && (
							<motion.p
								variants={errorMsg}
								initial="hidden"
								animate="visible"
								className="text-destructive text-sm"
							>
								{errors.firstName.message}
							</motion.p>
						)}
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
						{errors.lastName && (
							<motion.p
								variants={errorMsg}
								initial="hidden"
								animate="visible"
								className="text-destructive text-sm"
							>
								{errors.lastName.message}
							</motion.p>
						)}
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
					{errors.email && (
						<motion.p
							variants={errorMsg}
							initial="hidden"
							animate="visible"
							className="text-destructive text-sm"
						>
							{errors.email.message}
						</motion.p>
					)}
				</motion.div>

				<motion.div variants={staggerItem} className="space-y-2">
					<Label htmlFor="password">{t("common.fields.password")}</Label>
					<PasswordInput
						id="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.register.placeholders.password")}
					/>
					{errors.password && (
						<motion.p
							variants={errorMsg}
							initial="hidden"
							animate="visible"
							className="text-destructive text-sm"
						>
							{errors.password.message}
						</motion.p>
					)}
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
					{errors.confirmPassword && (
						<motion.p
							variants={errorMsg}
							initial="hidden"
							animate="visible"
							className="text-destructive text-sm"
						>
							{errors.confirmPassword.message}
						</motion.p>
					)}
				</motion.div>

				<motion.div variants={staggerItem}>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="h-11 w-full font-semibold"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("auth.register.submitting")}
							</>
						) : (
							t("auth.register.submit")
						)}
					</Button>
				</motion.div>
			</form>
		</motion.div>
	);
};

export default Register;
