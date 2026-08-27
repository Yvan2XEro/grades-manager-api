import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function getTokenFromHash(): string | null {
	// HashRouter URL: /#/reset-password?token=...
	const hashPart = window.location.hash; // e.g. "#/reset-password?token=abc"
	const queryStart = hashPart.indexOf("?");
	if (queryStart === -1) return null;
	const params = new URLSearchParams(hashPart.slice(queryStart + 1));
	return params.get("token");
}

export function ResetPasswordPage() {
	const { t } = useTranslation();
	const token = getTokenFromHash();

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!token) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
					<h1 className="font-bold text-2xl text-primary">{t("app.name")}</h1>
					<p className="mt-2 mb-4 text-destructive text-sm">
						{t("auth.invalid_reset_link")}
					</p>
					<Link
						to="/forgot-password"
						className="text-primary text-sm hover:underline"
					>
						{t("auth.forgot_password_title")}
					</Link>
				</div>
			</div>
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError(t("auth.passwords_dont_match"));
			return;
		}

		setLoading(true);
		try {
			const result = await authClient.resetPassword({
				newPassword: password,
				token: token!,
			});
			if (result.error) {
				setError(result.error.message ?? t("common.error"));
			} else {
				setDone(true);
			}
		} catch {
			setError(t("common.error"));
		} finally {
			setLoading(false);
		}
	}

	if (done) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
					<h1 className="font-bold text-2xl text-primary">{t("app.name")}</h1>
					<p className="mb-2 text-muted-foreground text-sm">
						{t("auth.password_updated")}
					</p>
					<p className="mb-4 text-foreground text-sm">
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
				<h1 className="font-bold text-2xl text-primary">{t("app.name")}</h1>
				<p className="mb-6 text-muted-foreground text-sm">
					{t("auth.reset_password_title")}
				</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div>
						<label className="mb-1 block font-medium text-foreground text-sm">
							{t("auth.new_password")}
						</label>
						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					<div>
						<label className="mb-1 block font-medium text-foreground text-sm">
							{t("auth.confirm_password")}
						</label>
						<Input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
						/>
					</div>

					{error && <p className="text-destructive text-sm">{error}</p>}

					<Button type="submit" disabled={loading} className="w-full">
						{loading ? t("common.loading") : t("auth.update_password")}
					</Button>

					<Link to="/login" className="text-primary text-sm hover:underline">
						{t("auth.back_to_login")}
					</Link>
				</form>
			</div>
		</div>
	);
}
