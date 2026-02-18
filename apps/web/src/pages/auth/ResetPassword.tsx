import { zodResolver } from "@hookform/resolvers/zod";
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
		try {
			await authClient.resetPassword({
				token,
				newPassword: data.password,
			});
			toast.success(t("auth.reset.success"));
			navigate("/auth/login");
		} catch (error: any) {
			toast.error(error.message || t("auth.reset.error"));
		}
	};

	return (
		<div>
			<div className="mb-8">
				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
					<KeyRound className="h-6 w-6 text-primary" />
				</div>
				<h2 className="font-heading font-bold text-2xl text-foreground">
					{t("auth.reset.title")}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.reset.subtitle", {
						defaultValue: "Choose a strong password for your account.",
					})}
				</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<div className="space-y-2">
					<Label htmlFor="password">{t("auth.reset.newPassword")}</Label>
					<Input
						id="password"
						type="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.reset.passwordPlaceholder")}
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
					<Input
						id="confirmPassword"
						type="password"
						{...register("confirmPassword")}
						className="h-11"
						placeholder={t("auth.reset.confirmPasswordPlaceholder")}
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
							{t("auth.reset.submitting")}
						</>
					) : (
						t("auth.reset.submit")
					)}
				</Button>

				<div className="text-center">
					<Link
						to={`/auth/login?return=${callbackURL}`}
						className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						{t("auth.reset.backToLogin")}
					</Link>
				</div>
			</form>
		</div>
	);
};

export default ResetPassword;
