import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
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
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "var(--color-bg)",
			}}
		>
			<div
				style={{
					background: "var(--color-surface)",
					border: "1px solid var(--color-border)",
					borderRadius: "var(--radius)",
					padding: "2rem",
					width: "100%",
					maxWidth: "400px",
				}}
			>
				<h1
					style={{
						color: "var(--color-primary)",
						fontSize: "1.5rem",
						fontWeight: 700,
						marginBottom: "0.25rem",
					}}
				>
					{t("app.name")}
				</h1>
				<p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
					{t("app.tagline")}
				</p>

				<form
					onSubmit={handleSubmit}
					style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
				>
					<div>
						<label
							style={{
								display: "block",
								fontSize: "0.875rem",
								marginBottom: "0.25rem",
							}}
						>
							{t("auth.email")}
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							style={{
								width: "100%",
								padding: "0.5rem 0.75rem",
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius)",
								background: "var(--color-bg)",
								color: "var(--color-text)",
								fontSize: "0.875rem",
								boxSizing: "border-box",
							}}
						/>
					</div>
					<div>
						<label
							style={{
								display: "block",
								fontSize: "0.875rem",
								marginBottom: "0.25rem",
							}}
						>
							{t("auth.password")}
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							style={{
								width: "100%",
								padding: "0.5rem 0.75rem",
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius)",
								background: "var(--color-bg)",
								color: "var(--color-text)",
								fontSize: "0.875rem",
								boxSizing: "border-box",
							}}
						/>
					</div>

					{error && (
						<p style={{ color: "oklch(0.55 0.22 25)", fontSize: "0.875rem" }}>
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={loading}
						style={{
							background: "var(--color-primary)",
							color: "#fff",
							border: "none",
							borderRadius: "var(--radius)",
							padding: "0.625rem 1rem",
							fontWeight: 600,
							cursor: loading ? "not-allowed" : "pointer",
							opacity: loading ? 0.7 : 1,
						}}
					>
						{loading ? t("common.loading") : t("auth.sign_in")}
					</button>
				</form>
			</div>
		</div>
	);
}
