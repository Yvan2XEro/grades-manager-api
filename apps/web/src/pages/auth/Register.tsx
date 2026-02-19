import { zodResolver } from "@hookform/resolvers/zod";
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
import { authClient } from "../../lib/auth-client";

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
		try {
			await authClient.signUp.email({
				email: data.email,
				password: data.password,
				name: `${data.firstName} ${data.lastName}`,
			});

			await authClient.signIn.email({
				email: data.email,
				password: data.password,
				callbackURL: callbackURL || undefined,
			});

			toast.success(t("auth.register.success"));
			navigate("/teacher");
		} catch (error: any) {
			toast.error(error.message || t("auth.register.error"));
		}
	};

	return (
		<div>
			<div className="mb-8">
				<h2 className="font-heading font-bold text-2xl text-foreground">
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
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<div className="grid grid-cols-2 gap-4">
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
							<p className="text-destructive text-sm">
								{errors.firstName.message}
							</p>
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
							<p className="text-destructive text-sm">
								{errors.lastName.message}
							</p>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email">{t("common.fields.email")}</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="h-11"
						placeholder={t("auth.register.placeholders.email")}
					/>
					{errors.email && (
						<p className="text-destructive text-sm">
							{errors.email.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="password">{t("common.fields.password")}</Label>
					<PasswordInput
						id="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.register.placeholders.password")}
					/>
					{errors.password && (
						<p className="text-destructive text-sm">
							{errors.password.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
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
						<p className="text-destructive text-sm">
							{errors.confirmPassword.message}
						</p>
					)}
				</div>

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
			</form>
		</div>
	);
};

export default Register;
