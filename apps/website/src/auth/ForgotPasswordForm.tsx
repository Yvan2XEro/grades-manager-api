"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Dict } from "@/i18n";
import { DeliberationDemo } from "@/marketing/demos/DeliberationDemo";
import { AuthShell } from "./AuthShell";

type FormData = { email: string };

const inputCls =
	"w-full py-3 px-4 bg-tk-bg border border-tk-border rounded-[0.625rem] text-tk-ink text-[0.9375rem] font-body outline-none transition-colors duration-150 focus:border-tk-primary";
const labelCls = "block text-tk-ink-soft text-sm font-medium mb-1.5 font-body";

export function ForgotPasswordForm({ dict: d }: { dict: Dict }) {
	const [submitting, setSubmitting] = useState(false);
	const [sent, setSent] = useState(false);
	const [sentEmail, setSentEmail] = useState("");
	const [serverError, setServerError] = useState<string>();
	const { register, handleSubmit } = useForm<FormData>();
	const fp = d.auth.forgotPassword;

	const onSubmit = async (data: FormData) => {
		setSubmitting(true);
		setServerError(undefined);
		try {
			await fetch("/api/users/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: data.email }),
			});
			// Always show success — don't reveal whether email exists
			setSentEmail(data.email);
			setSent(true);
		} catch {
			setServerError(fp.error_server);
		} finally {
			setSubmitting(false);
		}
	};

	if (sent) {
		return (
			<AuthShell dict={d} demo={<DeliberationDemo t={d.demos.delib} />}>
				<div className="flex flex-col items-center gap-4 py-8 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.95_0.05_250)] text-3xl">
						✉️
					</div>
					<h1 className="font-bold font-display text-[1.625rem] text-tk-ink tracking-[-0.03em]">
						{fp.sent_title}
					</h1>
					<p className="font-body text-[0.9375rem] text-tk-muted leading-relaxed">
						{fp.sent_body.replace("{email}", sentEmail)}
					</p>
					<Link
						href="/login"
						className="mt-2 font-body font-medium text-sm text-tk-primary no-underline hover:underline"
					>
						{d.auth.verify.login_cta}
					</Link>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell dict={d} demo={<DeliberationDemo t={d.demos.delib} />}>
			<div>
				<h1 className="mb-1 font-bold font-display text-[1.625rem] text-tk-ink tracking-[-0.03em]">
					{fp.title}
				</h1>
				<p className="mb-8 font-body text-[0.9375rem] text-tk-muted">
					{fp.sub}
				</p>

				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
					<div>
						<label className={labelCls}>{fp.email}</label>
						<input
							type="email"
							autoComplete="email"
							{...register("email", { required: true })}
							className={inputCls}
						/>
					</div>

					{serverError && (
						<div className="rounded-[0.625rem] border border-[oklch(0.65_0.2_25/0.25)] bg-[oklch(0.65_0.2_25/0.06)] px-4 py-3 font-body text-[oklch(0.5_0.18_25)] text-sm">
							{serverError}
						</div>
					)}

					<button
						type="submit"
						disabled={submitting}
						className={`tk-btn-primary mt-1 justify-center ${submitting ? "cursor-wait opacity-70" : ""}`}
					>
						{submitting ? fp.submitting : fp.submit}
					</button>
				</form>

				<p className="mt-6 text-center font-body text-[0.875rem] text-tk-muted">
					<Link
						href="/login"
						className="font-medium text-tk-primary no-underline hover:underline"
					>
						{d.auth.verify.login_cta}
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
