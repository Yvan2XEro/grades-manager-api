import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";

export function LoginPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const result = await signIn.email({ email, password });
			if (result.error) {
				setError(t("auth.invalid_credentials"));
			} else {
				navigate("/");
			}
		} catch {
			setError(t("auth.invalid_credentials"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
				<h1 className="font-bold text-2xl text-primary">{t("app.name")}</h1>
				<p className="mb-6 text-muted-foreground text-sm">{t("app.tagline")}</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

					<div>
						<label className="mb-1 block font-medium text-foreground text-sm">
							{t("auth.password")}
						</label>
						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<div className="mt-1 text-right">
							<Link
								to="/forgot-password"
								className="text-primary text-sm hover:underline"
							>
								{t("auth.forgot_password")}
							</Link>
						</div>
					</div>

					{error && <p className="text-destructive text-sm">{error}</p>}

					<Button type="submit" disabled={loading} className="w-full">
						{loading ? t("common.loading") : t("auth.sign_in")}
					</Button>
				</form>
			</div>
		</div>
	);
}
