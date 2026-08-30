import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, signIn } from "@/lib/auth-client";

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
	const { t } = useTranslation();
	const [totpStep, setTotpStep] = useState(false);
	const [totpCode, setTotpCode] = useState("");
	const [totpError, setTotpError] = useState("");
	const [totpLoading, setTotpLoading] = useState(false);

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = handleSubmit(async (values) => {
		const result = await signIn.email({
			email: values.email,
			password: values.password,
		});
		if (result.error) {
			setError("root", { message: t("auth.invalid_credentials") });
			return;
		}
		// Better-Auth signals 2FA is required via twoFactorRedirect
		if ((result.data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
			setTotpStep(true);
			return;
		}
		// Full reload so session is re-initialized from scratch (avoids race with router guard)
		window.location.href = "/";
	});

	const handleTotpSubmit = async () => {
		const code = totpCode.replace(/\D/g, "");
		if (code.length !== 6) {
			setTotpError(t("settings.2fa_enter_code", "Enter the 6-digit code"));
			return;
		}
		setTotpError("");
		setTotpLoading(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (authClient.twoFactor.verifyTotp as any)({ code });
		setTotpLoading(false);
		if (res?.error) {
			setTotpError(t("auth.invalid_totp", "Invalid code, try again"));
			return;
		}
		window.location.href = "/";
	};

	if (totpStep) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
					<h1 className="font-bold text-2xl text-primary">{t("app.name")}</h1>
					<p className="mb-6 text-muted-foreground text-sm">
						{t(
							"auth.2fa_prompt",
							"Enter the 6-digit code from your authenticator app",
						)}
					</p>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="totp">
								{t("settings.2fa_totp_code", "Authenticator code")}
							</Label>
							<Input
								id="totp"
								inputMode="numeric"
								maxLength={6}
								placeholder="000000"
								className="font-mono tracking-widest"
								value={totpCode}
								autoFocus
								onChange={(e) =>
									setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
								}
								onKeyDown={(e) => e.key === "Enter" && handleTotpSubmit()}
							/>
							{totpError && (
								<p className="text-destructive text-xs">{totpError}</p>
							)}
						</div>
						<Button
							onClick={handleTotpSubmit}
							disabled={totpLoading}
							className="w-full"
						>
							{totpLoading ? t("common.loading") : t("auth.verify", "Verify")}
						</Button>
						<button
							type="button"
							className="text-center text-muted-foreground text-xs hover:text-foreground"
							onClick={() => {
								setTotpStep(false);
								setTotpCode("");
								setTotpError("");
							}}
						>
							{t("auth.back_to_login", "← Back to sign in")}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
				<h1 className="font-bold text-2xl text-primary">{t("app.name")}</h1>
				<p className="mb-6 text-muted-foreground text-sm">{t("app.tagline")}</p>

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

					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">{t("auth.password")}</Label>
							<Link
								to="/forgot-password"
								className="text-primary text-xs hover:underline"
							>
								{t("auth.forgot_password")}
							</Link>
						</div>
						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							{...register("password")}
						/>
						{errors.password && (
							<p className="text-destructive text-xs">
								{errors.password.message}
							</p>
						)}
					</div>

					{errors.root && (
						<p className="text-destructive text-sm">{errors.root.message}</p>
					)}

					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? t("common.loading") : t("auth.sign_in")}
					</Button>
				</form>
			</div>
		</div>
	);
}
