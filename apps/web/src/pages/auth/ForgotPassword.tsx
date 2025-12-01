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
import { authClient } from "../../lib/auth-client";

const buildSchema = (t: TFunction) =>
	z.object({
		email: z.string().email(t("auth.validation.email")),
	});

type FormData = z.infer<ReturnType<typeof buildSchema>>;

const ForgotPassword: React.FC = () => {
	const { t } = useTranslation();
	const [callbackURL] = useQueryState("return", {});
	const schema = React.useMemo(() => buildSchema(t), [t]);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormData>({ resolver: zodResolver(schema) });

	const onSubmit = async (data: FormData) => {
		try {
			await authClient.requestPasswordReset({
				email: data.email,
				redirectTo: `${window.location.origin}/auth/reset?return=${callbackURL}`,
			});
			toast.success(t("auth.forgot.success"));
		} catch (error: any) {
			toast.error(error.message || t("auth.forgot.error"));
		}
	};

	return (
		<div>
			<h2 className="mb-6 text-center font-semibold text-xl">
				{t("auth.forgot.title")}
			</h2>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div>
					<Label htmlFor="email" className="mb-1 block">
						{t("common.fields.email")}
					</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="w-full"
						placeholder={t("auth.forgot.emailPlaceholder")}
					/>
					{errors.email && (
						<p className="mt-1 text-error-600 text-sm">
							{errors.email.message}
						</p>
					)}
				</div>
				<Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{t("auth.forgot.submitting")}
						</>
					) : (
						t("auth.forgot.submit")
					)}
				</Button>
				<div className="mt-1 text-right">
					<Link
						to={`/auth/login?return=${callbackURL}`}
						className="text-primary-600 text-sm hover:text-primary-500"
					>
						{t("auth.forgot.backToLogin")}
					</Link>
				</div>
			</form>
		</div>
	);
};

export default ForgotPassword;
