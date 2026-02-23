import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import type { TFunction } from "i18next";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PasswordInput } from "../../components/ui/password-input";
import { errorMsg, staggerContainer, staggerItem } from "../../lib/animations";
import { authClient } from "../../lib/auth-client";

const buildSchema = (t: TFunction) =>
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

type FormData = z.infer<ReturnType<typeof buildSchema>>;

const ResetPassword: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get("token") || "";
	const { t } = useTranslation();
	const schema = React.useMemo(() => buildSchema(t), [t]);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormData>({ resolver: zodResolver(schema) });

	const [callbackURL] = useQueryState("return", {});
	const onSubmit = async (data: FormData) => {
		const result = await authClient.resetPassword({
			token,
			newPassword: data.password,
		});

		if (result.error) {
			toast.error(result.error.message || t("auth.reset.error"));
		} else {
			toast.success(t("auth.reset.success"));
			navigate("/auth/login");
		}
	};

	return (
		<motion.div variants={staggerContainer} initial="hidden" animate="visible">
			<motion.div variants={staggerItem} className="mb-8">
				<motion.div
					className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
					whileHover={{ scale: 1.05 }}
					transition={{ duration: 0.2 }}
				>
					<KeyRound className="h-6 w-6 text-primary" />
				</motion.div>
				<h2 className="font-bold font-heading text-2xl text-foreground">
					{t("auth.reset.title")}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.reset.subtitle", {
						defaultValue: "Choose a strong password for your account.",
					})}
				</p>
			</motion.div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<motion.div variants={staggerItem} className="space-y-2">
					<Label htmlFor="password">{t("auth.reset.newPassword")}</Label>
					<PasswordInput
						id="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.reset.passwordPlaceholder")}
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
						placeholder={t("auth.reset.confirmPasswordPlaceholder")}
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
								{t("auth.reset.submitting")}
							</>
						) : (
							t("auth.reset.submit")
						)}
					</Button>
				</motion.div>

				<motion.div variants={staggerItem} className="text-center">
					<Link
						to={`/auth/login?return=${callbackURL}`}
						className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						{t("auth.reset.backToLogin")}
					</Link>
				</motion.div>
			</form>
		</motion.div>
	);
};

export default ResetPassword;
