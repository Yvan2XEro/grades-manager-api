import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
	email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
	const { t } = useTranslation();
	const [sent, setSent] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { email: "" },
	});

	const onSubmit = handleSubmit(async (values) => {
		await authClient.forgetPassword({
			email: values.email,
			redirectTo: `${window.location.origin}/#/reset-password`,
		});
		setSent(true);
	});

	if (sent) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center text-card-foreground shadow-sm">
					<CheckCircle className="mx-auto mb-4 h-10 w-10 text-primary" />
					<h1 className="font-bold text-foreground text-xl">
						{t("auth.check_email")}
					</h1>
					<p className="mt-2 mb-6 text-muted-foreground text-sm">
						{t("auth.check_email_desc")}
					</p>
					<Link to="/login" className="text-primary text-sm hover:underline">
						{t("auth.back_to_login")}
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
				<div className="mb-1 flex items-center gap-2">
					<Mail className="h-5 w-5 text-primary" />
					<h1 className="font-bold text-2xl text-primary">
						{t("auth.forgot_password_title")}
					</h1>
				</div>
				<p className="mb-6 text-muted-foreground text-sm">
					{t("auth.forgot_password_desc")}
				</p>

				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="email">{t("auth.email")}</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							{...register("email")}
						/>
						{errors.email && (
							<p className="text-destructive text-xs">{errors.email.message}</p>
						)}
					</div>

					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? t("common.loading") : t("auth.send_reset_link")}
					</Button>

					<Link
						to="/login"
						className="text-center text-primary text-sm hover:underline"
					>
						{t("auth.back_to_login")}
					</Link>
				</form>
			</div>
		</div>
	);
}
