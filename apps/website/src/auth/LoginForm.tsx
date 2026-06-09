"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Dict } from "@/i18n";

type FormData = { email: string; password: string };

const inputCls =
	"w-full py-3 px-4 bg-tk-bg border border-tk-border rounded-[0.625rem] text-tk-ink text-[0.9375rem] font-body outline-none transition-colors duration-150 focus:border-tk-primary";
const labelCls = "block text-tk-ink-soft text-sm font-medium mb-1.5 font-body";
const errorCls = "mt-1 text-[0.8125rem] text-[oklch(0.55_0.2_25)] font-body";

export function LoginForm({ dict: d }: { dict: Dict }) {
	const [submitting, setSubmitting] = useState(false);
	const [serverError, setServerError] = useState<string>();
	const router = useRouter();
	const searchParams = useSearchParams();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormData>();

	const onSubmit = async (data: FormData) => {
		setSubmitting(true);
		setServerError(undefined);
		try {
			const res = await fetch("/api/users/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: data.email, password: data.password }),
				credentials: "include",
			});
			if (res.ok) {
				router.push(searchParams.get("next") ?? "/dashboard");
			} else {
				setServerError(d.auth.login.error_invalid);
			}
		} catch {
			setServerError(d.auth.login.error_server);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-tk-dark px-4 py-16">
			<div className="tk-grid-pattern pointer-events-none absolute inset-0" />
			<div className="relative z-10 w-full max-w-[440px]">
				<div className="mb-8 flex justify-center">
					<Link href="/">
						<Image
							src="/logo-tkams.png"
							alt="TKAMS"
							width={120}
							height={36}
							className="h-9 w-auto brightness-200"
							priority
						/>
					</Link>
				</div>

				<div className="rounded-[1.25rem] border border-tk-border bg-tk-surface p-8 shadow-[0_16px_48px_oklch(0_0_0/0.2)]">
					<h1 className="mb-1 font-bold font-display text-[1.375rem] text-tk-ink tracking-[-0.03em]">
						{d.auth.login.title}
					</h1>
					<p className="mb-7 font-body text-[0.875rem] text-tk-muted">
						{d.auth.login.sub}
					</p>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className="flex flex-col gap-5"
					>
						<div>
							<label className={labelCls}>{d.auth.login.email}</label>
							<input
								type="email"
								autoComplete="email"
								{...register("email", { required: true })}
								className={inputCls}
							/>
							{errors.email && (
								<p className={errorCls}>{d.auth.signup.errors.required}</p>
							)}
						</div>

						<div>
							<label className={labelCls}>{d.auth.login.password}</label>
							<input
								type="password"
								autoComplete="current-password"
								{...register("password", { required: true })}
								className={inputCls}
							/>
							{errors.password && (
								<p className={errorCls}>{d.auth.signup.errors.required}</p>
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
							{submitting ? d.auth.login.submitting : d.auth.login.submit}
						</button>
					</form>

					<p className="mt-6 text-center font-body text-[0.875rem] text-tk-muted">
						{d.auth.login.no_account}{" "}
						<Link
							href="/signup"
							className="font-medium text-tk-primary no-underline hover:underline"
						>
							{d.auth.login.signup_link}
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
}
