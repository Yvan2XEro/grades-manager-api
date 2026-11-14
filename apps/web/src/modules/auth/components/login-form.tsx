import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { buildLoginSchema, type LoginFormData } from "../services/auth-schemas";
import { loginContainer, loginItem } from "../services/login-motion";
import { AuthSubmitButton } from "./auth-submit-button";

function LoginFieldError({ message }: { message?: string }) {
	if (!message) return null;
	return (
		<motion.p
			initial={{ opacity: 0, y: -4 }}
			animate={{ opacity: 1, y: 0 }}
			className="text-destructive text-sm"
		>
			{message}
		</motion.p>
	);
}

/** Email / password / remember-me form of both login modes. */
export function LoginForm({
	subtitle,
	forgotPasswordHref,
	onSubmit,
}: {
	subtitle: string;
	/** Shows a "forgot password" link next to the password label. */
	forgotPasswordHref?: string;
	onSubmit: (data: LoginFormData, rememberMe: boolean) => Promise<void>;
}) {
	const { t } = useTranslation();
	const loginSchema = useMemo(() => buildLoginSchema(t), [t]);
	const [rememberMe, setRememberMe] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	return (
		<motion.div variants={loginContainer} initial="hidden" animate="visible">
			<motion.div variants={loginItem} className="mb-8">
				<h2 className="text-foreground">{t("auth.login.title")}</h2>
				<p className="mt-2 text-muted-foreground text-sm">{subtitle}</p>
			</motion.div>

			<form
				onSubmit={handleSubmit((data) => onSubmit(data, rememberMe))}
				className="space-y-5"
			>
				<motion.div variants={loginItem} className="space-y-2">
					<Label htmlFor="email">{t("common.fields.email")}</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="h-11"
						placeholder={t("auth.login.emailPlaceholder")}
					/>
					<LoginFieldError message={errors.email?.message} />
				</motion.div>

				<motion.div variants={loginItem} className="space-y-2">
					{forgotPasswordHref ? (
						<div className="flex items-center justify-between">
							<Label htmlFor="password">{t("common.fields.password")}</Label>
							<Link
								to={forgotPasswordHref}
								className="text-primary text-sm hover:text-primary/80"
							>
								{t("auth.login.forgotPassword")}
							</Link>
						</div>
					) : (
						<Label htmlFor="password">{t("common.fields.password")}</Label>
					)}
					<PasswordInput
						id="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.login.passwordPlaceholder")}
					/>
					<LoginFieldError message={errors.password?.message} />
				</motion.div>

				<motion.div variants={loginItem} className="flex items-center gap-2">
					<Checkbox
						id="remember"
						checked={rememberMe}
						onCheckedChange={(v) => setRememberMe(Boolean(v))}
					/>
					<Label
						htmlFor="remember"
						className="cursor-pointer font-normal text-sm"
					>
						{t("auth.login.rememberMe", {
							defaultValue: "Se souvenir de moi pendant 30 jours",
						})}
					</Label>
				</motion.div>

				<motion.div variants={loginItem}>
					<AuthSubmitButton
						isSubmitting={isSubmitting}
						label={t("auth.login.submit")}
						submittingLabel={t("auth.login.submitting")}
					/>
				</motion.div>
			</form>
		</motion.div>
	);
}
