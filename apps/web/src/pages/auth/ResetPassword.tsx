import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { Loader2 } from "lucide-react";
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
			<h2 className="mb-6 text-center font-semibold text-xl">
				{t("auth.reset.title")}
			</h2>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div>
					<Label htmlFor="password" className="mb-1 block">
						{t("auth.reset.newPassword")}
					</Label>
					<Input
						id="password"
						type="password"
						{...register("password")}
						className="w-full"
						placeholder={t("auth.reset.passwordPlaceholder")}
					/>
					{errors.password && (
						<p className="mt-1 text-error-600 text-sm">
							{errors.password.message}
						</p>
					)}
				</div>
				<div>
					<Label htmlFor="confirmPassword" className="mb-1 block">
						{t("common.fields.confirmPassword")}
					</Label>
					<Input
						id="confirmPassword"
						type="password"
						{...register("confirmPassword")}
						className="w-full"
						placeholder={t("auth.reset.confirmPasswordPlaceholder")}
					/>
					{errors.confirmPassword && (
						<p className="mt-1 text-error-600 text-sm">
							{errors.confirmPassword.message}
						</p>
					)}
				</div>
				<Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{t("auth.reset.submitting")}
						</>
					) : (
						t("auth.reset.submit")
					)}
				</Button>
				<div className="mt-1 text-right">
					<Link
						to="/auth/login"
						className="text-primary-600 text-sm hover:text-primary-500"
					>
						{t("auth.reset.backToLogin")}
					</Link>
				</div>
			</form>
		</div>
	);
};

export default ResetPassword;
