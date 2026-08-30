import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const schema = z
	.object({
		password: z.string().min(8),
		confirm: z.string().min(1),
	})
	.refine((d) => d.password === d.confirm, {
		path: ["confirm"],
		message: "auth.passwords_dont_match",
	});

type FormValues = z.infer<typeof schema>;

function getToken(): string | null {
	// HashRouter: URL is /#/reset-password?token=xxx
	const hash = window.location.hash; // "#/reset-password?token=xxx"
	const qIndex = hash.indexOf("?");
	if (qIndex === -1) return null;
	return new URLSearchParams(hash.slice(qIndex + 1)).get("token");
}

export function ResetPasswordPage() {
	const { t } = useTranslation();
	const [done, setDone] = useState(false);
	const token = getToken();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { password: "", confirm: "" },
	});

	const onSubmit = handleSubmit(async (values) => {
		if (!token) return;
		const result = await authClient.resetPassword({
			newPassword: values.password,
			token,
		});
		if (result.error) {
			setError("root", { message: t("auth.invalid_reset_link") });
		} else {
			setDone(true);
		}
	});

	if (!token) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center text-card-foreground shadow-sm">
					<ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
					<h1 className="font-bold text-foreground text-xl">
						{t("auth.invalid_reset_link")}
					</h1>
					<p className="mt-2 mb-6 text-muted-foreground text-sm">
						{t("auth.forgot_password_desc")}
					</p>
					<Link
						to="/forgot-password"
						className="text-primary text-sm hover:underline"
					>
						{t("auth.send_reset_link")}
					</Link>
				</div>
			</div>
		);
	}

	if (done) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center text-card-foreground shadow-sm">
					<CheckCircle className="mx-auto mb-4 h-10 w-10 text-primary" />
					<h1 className="font-bold text-foreground text-xl">
						{t("auth.password_updated")}
					</h1>
					<p className="mt-2 mb-6 text-muted-foreground text-sm">
						{t("auth.password_updated_desc")}
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
				<h1 className="mb-1 font-bold text-2xl text-primary">
					{t("auth.reset_password_title")}
				</h1>
				<p className="mb-6 text-muted-foreground text-sm">
					{t("auth.forgot_password_desc")}
				</p>

				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="password">{t("auth.new_password")}</Label>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							{...register("password")}
						/>
						{errors.password && (
							<p className="text-destructive text-xs">
								{errors.password.message}
							</p>
						)}
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="confirm">{t("auth.confirm_password")}</Label>
						<Input
							id="confirm"
							type="password"
							autoComplete="new-password"
							{...register("confirm")}
						/>
						{errors.confirm && (
							<p className="text-destructive text-xs">
								{t(errors.confirm.message ?? "")}
							</p>
						)}
					</div>

					{errors.root && (
						<p className="text-destructive text-sm">{errors.root.message}</p>
					)}

					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? t("common.loading") : t("auth.update_password")}
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
