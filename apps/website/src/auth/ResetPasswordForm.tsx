"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Dict } from "@/i18n";
import { DeliberationDemo } from "@/marketing/demos/DeliberationDemo";
import { AuthShell } from "./AuthShell";

type FormData = { password: string; confirm: string };

const inputCls =
	"w-full py-3 px-4 bg-tk-bg border border-tk-border rounded-[0.625rem] text-tk-ink text-[0.9375rem] font-body outline-none transition-colors duration-150 focus:border-tk-primary";
const labelCls = "block text-tk-ink-soft text-sm font-medium mb-1.5 font-body";
const errorCls = "mt-1 text-[0.8125rem] text-[oklch(0.55_0.2_25)] font-body";

export function ResetPasswordForm({ dict: d }: { dict: Dict }) {
	const [submitting, setSubmitting] = useState(false);
	const [serverError, setServerError] = useState<string>();
	const [success, setSuccess] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token") ?? "";
	const rp = d.auth.resetPassword;

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<FormData>();

	const password = watch("password");

	const onSubmit = async (data: FormData) => {
		setSubmitting(true);
		setServerError(undefined);
		try {
			const res = await fetch("/api/users/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password: data.password }),
			});
			if (res.ok) {
				setSuccess(true);
				setTimeout(() => router.push("/login"), 2500);
			} else {
				setServerError(rp.error_invalid);
			}
		} catch {
			setServerError(rp.error_server);
		} finally {
			setSubmitting(false);
		}
	};

	if (!token) {
		return (
			<AuthShell dict={d} demo={<DeliberationDemo t={d.demos.delib} />}>
				<div className="flex flex-col items-center gap-4 py-8 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
						✗
					</div>
					<h1 className="font-bold font-display text-[1.625rem] text-tk-ink tracking-[-0.03em]">
						{rp.missing_title}
					</h1>
					<p className="font-body text-[0.9375rem] text-tk-muted">
						{rp.missing_body}
					</p>
					<Link
						href="/forgot-password"
						className="mt-2 font-body font-medium text-sm text-tk-primary no-underline hover:underline"
					>
						{rp.retry_cta}
					</Link>
				</div>
			</AuthShell>
		);
	}

	if (success) {
		return (
			<AuthShell dict={d} demo={<DeliberationDemo t={d.demos.delib} />}>
				<div className="flex flex-col items-center gap-4 py-8 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
						✓
					</div>
					<h1 className="font-bold font-display text-[1.625rem] text-tk-ink tracking-[-0.03em]">
						{rp.success_title}
					</h1>
					<p className="font-body text-[0.9375rem] text-tk-muted">
						{rp.success_body}
					</p>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell dict={d} demo={<DeliberationDemo t={d.demos.delib} />}>
			<div>
				<h1 className="mb-1 font-bold font-display text-[1.625rem] text-tk-ink tracking-[-0.03em]">
					{rp.title}
				</h1>
				<p className="mb-8 font-body text-[0.9375rem] text-tk-muted">
					{rp.sub}
				</p>

				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
					<div>
						<label className={labelCls}>{rp.password}</label>
						<input
							type="password"
							autoComplete="new-password"
							{...register("password", {
								required: d.auth.signup.errors.required,
								minLength: {
									value: 8,
									message: d.auth.signup.errors.password_min,
								},
							})}
							className={inputCls}
						/>
						{errors.password && (
							<p className={errorCls}>{errors.password.message}</p>
						)}
					</div>

					<div>
						<label className={labelCls}>{rp.confirm}</label>
						<input
							type="password"
							autoComplete="new-password"
							{...register("confirm", {
								required: d.auth.signup.errors.required,
								validate: (v) =>
									v === password || d.auth.signup.errors.password_mismatch,
							})}
							className={inputCls}
						/>
						{errors.confirm && (
							<p className={errorCls}>{errors.confirm.message}</p>
						)}
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
						{submitting ? rp.submitting : rp.submit}
					</button>
				</form>
			</div>
		</AuthShell>
	);
}
