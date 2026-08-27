import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordPage() {
	const { t } = useTranslation();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await authClient.forgetPassword({
				email,
				redirectTo: `${window.location.origin}/#/reset-password`,
			});
			setSent(true);
		} catch {
			setError(t("common.error"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
				<h1 className="font-bold text-2xl text-primary">{t("app.name")}</h1>
				<p className="mb-6 text-muted-foreground text-sm">
					{sent ? t("auth.check_email") : t("auth.forgot_password_title")}
				</p>

				{sent ? (
					<div className="flex flex-col gap-4">
						<p className="text-foreground text-sm">
							{t("auth.check_email_desc")}
						</p>
						<Link to="/login" className="text-primary text-sm hover:underline">
							{t("auth.back_to_login")}
						</Link>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<p className="text-muted-foreground text-sm">
							{t("auth.forgot_password_desc")}
						</p>

						<div>
							<label className="mb-1 block font-medium text-foreground text-sm">
								{t("auth.email")}
							</label>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						{error && <p className="text-destructive text-sm">{error}</p>}

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? t("common.loading") : t("auth.send_reset_link")}
						</Button>

						<Link to="/login" className="text-primary text-sm hover:underline">
							{t("auth.back_to_login")}
						</Link>
					</form>
				)}
			</div>
		</div>
	);
}
