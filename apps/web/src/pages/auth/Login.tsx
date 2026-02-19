import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PasswordInput } from "../../components/ui/password-input";
import { authClient } from "../../lib/auth-client";

const buildLoginSchema = (t: TFunction) =>
	z.object({
		email: z.string().email(t("auth.validation.email")),
		password: z.string().min(6, t("auth.validation.passwordMin", { count: 6 })),
	});

type LoginFormData = z.infer<ReturnType<typeof buildLoginSchema>>;

const Login: React.FC = () => {
	const { t } = useTranslation();
	const loginSchema = React.useMemo(() => buildLoginSchema(t), [t]);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});
	const [callbackURL] = useQueryState("return", {});
	const onSubmit = async (data: LoginFormData) => {
		try {
			await authClient.signIn.email({
				email: data.email,
				password: data.password,
				callbackURL: callbackURL || undefined,
			});

			toast.success(t("auth.login.success"));
		} catch (error: any) {
			toast.error(error.message || t("auth.login.error"));
		}
	};

	return (
		<div>
			<div className="mb-8">
				<h2 className="font-heading font-bold text-2xl text-foreground">
					{t("auth.login.title")}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.login.noAccount")}{" "}
					<Link
						to={`/auth/register?return=${callbackURL}`}
						className="font-medium text-primary hover:text-primary/80"
					>
						{t("auth.login.registerLink")}
					</Link>
				</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<div className="space-y-2">
					<Label htmlFor="email">{t("common.fields.email")}</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="h-11"
						placeholder={t("auth.login.emailPlaceholder")}
					/>
					{errors.email && (
						<p className="text-destructive text-sm">
							{errors.email.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="password">{t("common.fields.password")}</Label>
						<Link
							to={`/auth/forgot?return=${callbackURL}`}
							className="text-primary text-sm hover:text-primary/80"
						>
							{t("auth.login.forgotPassword")}
						</Link>
					</div>
					<PasswordInput
						id="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.login.passwordPlaceholder")}
					/>
					{errors.password && (
						<p className="text-destructive text-sm">
							{errors.password.message}
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
							{t("auth.login.submitting")}
						</>
					) : (
						t("auth.login.submit")
					)}
				</Button>
			</form>
		</div>
	);
};

export default Login;
