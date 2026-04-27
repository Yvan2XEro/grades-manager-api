import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import type { TFunction } from "i18next";
import { Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PasswordInput } from "../../components/ui/password-input";
import { authClient } from "../../lib/auth-client";
import { detectOrganizationSlug } from "../../lib/organization";

const container = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
	hidden: { opacity: 0, y: 14 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const buildLoginSchema = (t: TFunction) =>
	z.object({
		email: z.string().email(t("auth.validation.email")),
		password: z.string().min(6, t("auth.validation.passwordMin", { count: 6 })),
		rememberMe: z.boolean().optional(),
	});

type LoginFormData = z.infer<ReturnType<typeof buildLoginSchema>>;

const Login: React.FC = () => {
	const { t } = useTranslation();
	const loginSchema = React.useMemo(() => buildLoginSchema(t), [t]);

	const [rememberMe, setRememberMe] = React.useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});
	const [callbackURL] = useQueryState("return", {});
	const onSubmit = async (data: LoginFormData) => {
		let slug: string | undefined;
		try {
			slug = detectOrganizationSlug();
		} catch {
			// No slug available
		}

		const result = await authClient.signIn.email({
			email: data.email,
			password: data.password,
			rememberMe,
			callbackURL: callbackURL || undefined,
			fetchOptions: slug
				? { headers: { "X-Organization-Slug": slug } }
				: undefined,
		});

		if (result.error) {
			toast.error(result.error.message || t("auth.login.error"));
			return;
		}

		toast.success(t("auth.login.success"));
	};

	return (
		<motion.div variants={container} initial="hidden" animate="visible">
			<motion.div variants={item} className="mb-8">
				<h2 className="text-foreground">{t("auth.login.title")}</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.login.subtitle", {
						defaultValue: "Connectez-vous à votre espace.",
					})}
				</p>
			</motion.div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<motion.div variants={item} className="space-y-2">
					<Label htmlFor="email">{t("common.fields.email")}</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="h-11"
						placeholder={t("auth.login.emailPlaceholder")}
					/>
					{errors.email && (
						<motion.p
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-destructive text-sm"
						>
							{errors.email.message}
						</motion.p>
					)}
				</motion.div>

				<motion.div variants={item} className="space-y-2">
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
						<motion.p
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-destructive text-sm"
						>
							{errors.password.message}
						</motion.p>
					)}
				</motion.div>

				<motion.div variants={item} className="flex items-center gap-2">
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

				<motion.div variants={item}>
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
				</motion.div>
			</form>
		</motion.div>
	);
};

export default Login;
