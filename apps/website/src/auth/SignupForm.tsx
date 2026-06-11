"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Dict } from "@/i18n";
import { AuthShell } from "./AuthShell";

type FormData = {
	name: string;
	email: string;
	password: string;
	confirm: string;
};

const inputCls =
	"w-full py-3 px-4 bg-tk-bg border border-tk-border rounded-[0.625rem] text-tk-ink text-[0.9375rem] font-body outline-none transition-colors duration-150 focus:border-tk-primary";
const labelCls = "block text-tk-ink-soft text-sm font-medium mb-1.5 font-body";
const errorCls = "mt-1 text-[0.8125rem] text-[oklch(0.55_0.2_25)] font-body";

export function SignupForm({ dict: d }: { dict: Dict }) {
	const [submitting, setSubmitting] = useState(false);
	const [serverError, setServerError] = useState<string>();
	const router = useRouter();
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
			const createRes = await fetch("/api/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: data.name,
					email: data.email,
					password: data.password,
				}),
				credentials: "include",
			});
			if (!createRes.ok) {
				const err = await createRes.json().catch(() => ({}));
				const isDuplicate =
					JSON.stringify(err).toLowerCase().includes("duplicate") ||
					createRes.status === 409;
				setServerError(
					isDuplicate ? d.auth.signup.error_email : d.auth.signup.error_server,
				);
				return;
			}

			const loginRes = await fetch("/api/users/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: data.email, password: data.password }),
				credentials: "include",
			});
			if (loginRes.ok) {
				router.push("/dashboard");
			} else {
				router.push("/login");
			}
		} catch {
			setServerError(d.auth.signup.error_server);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AuthShell dict={d}>
			<div>
				<h1 className="mb-1 font-bold font-display text-[1.625rem] text-tk-ink tracking-[-0.03em]">
					{d.auth.signup.title}
				</h1>
				<p className="mb-8 font-body text-[0.9375rem] text-tk-muted">
					{d.auth.signup.sub}
				</p>

				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
					<div>
						<label className={labelCls}>{d.auth.signup.name}</label>
						<input
							type="text"
							placeholder={d.auth.signup.name_placeholder}
							autoComplete="name"
							{...register("name", {
								required: d.auth.signup.errors.required,
							})}
							className={inputCls}
						/>
						{errors.name && <p className={errorCls}>{errors.name.message}</p>}
					</div>

					<div>
						<label className={labelCls}>{d.auth.signup.email}</label>
						<input
							type="email"
							autoComplete="email"
							{...register("email", {
								required: d.auth.signup.errors.required,
							})}
							className={inputCls}
						/>
						{errors.email && <p className={errorCls}>{errors.email.message}</p>}
					</div>

					<div>
						<label className={labelCls}>{d.auth.signup.password}</label>
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
						<label className={labelCls}>{d.auth.signup.confirm}</label>
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
						{submitting ? d.auth.signup.submitting : d.auth.signup.submit}
					</button>
				</form>

				<p className="mt-6 text-center font-body text-[0.875rem] text-tk-muted">
					{d.auth.signup.already_account}{" "}
					<Link
						href="/login"
						className="font-medium text-tk-primary no-underline hover:underline"
					>
						{d.auth.signup.login_link}
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
