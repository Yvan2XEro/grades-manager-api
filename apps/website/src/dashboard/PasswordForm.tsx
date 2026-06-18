"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import type { Dict } from "@/i18n";
import { cn } from "@/utilities/ui";

type FormData = {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
};

const inputCls =
	"w-full rounded-[0.625rem] border border-tk-border bg-tk-bg px-4 py-3 font-body text-[0.9375rem] text-tk-ink outline-none transition-colors focus:border-tk-primary";

export function PasswordForm({ dict: d }: { dict: Dict }) {
	const s = d.dashboard.settings;
	const [savedOk, setSavedOk] = useState(false);
	const [serverError, setServerError] = useState("");

	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { isSubmitting, errors },
	} = useForm<FormData>();

	const newPassword = watch("newPassword");

	const onSubmit = async (data: FormData) => {
		setSavedOk(false);
		setServerError("");
		const res = await fetch("/api/users/change-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				currentPassword: data.currentPassword,
				newPassword: data.newPassword,
			}),
		});
		if (res.ok) {
			setSavedOk(true);
			reset();
			setTimeout(() => setSavedOk(false), 4000);
		} else {
			const body = await res.json().catch(() => ({}));
			if (body.error === "wrong_password") {
				setServerError(s.password_error_wrong);
			} else {
				setServerError("An error occurred. Please try again.");
			}
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-5 rounded-[1rem] border border-tk-border bg-tk-surface p-6"
		>
			<div>
				<Label className="mb-1.5 block font-body font-medium text-[0.875rem] text-tk-ink-soft">
					{s.current_password}
				</Label>
				<input
					type="password"
					{...register("currentPassword", {
						required: d.register.errors.required,
					})}
					className={cn(
						inputCls,
						errors.currentPassword && "border-[oklch(0.65_0.2_25/0.5)]",
					)}
				/>
				{errors.currentPassword && (
					<p className="mt-1 font-body text-[0.8125rem] text-[oklch(0.55_0.2_25)]">
						{errors.currentPassword.message}
					</p>
				)}
			</div>

			<div>
				<Label className="mb-1.5 block font-body font-medium text-[0.875rem] text-tk-ink-soft">
					{s.new_password}
				</Label>
				<input
					type="password"
					{...register("newPassword", {
						required: d.register.errors.required,
						minLength: { value: 8, message: d.register.errors.password_min },
					})}
					className={cn(
						inputCls,
						errors.newPassword && "border-[oklch(0.65_0.2_25/0.5)]",
					)}
				/>
				{errors.newPassword && (
					<p className="mt-1 font-body text-[0.8125rem] text-[oklch(0.55_0.2_25)]">
						{errors.newPassword.message}
					</p>
				)}
			</div>

			<div>
				<Label className="mb-1.5 block font-body font-medium text-[0.875rem] text-tk-ink-soft">
					{s.confirm_password}
				</Label>
				<input
					type="password"
					{...register("confirmPassword", {
						required: d.register.errors.required,
						validate: (v) =>
							v === newPassword || d.register.errors.password_mismatch,
					})}
					className={cn(
						inputCls,
						errors.confirmPassword && "border-[oklch(0.65_0.2_25/0.5)]",
					)}
				/>
				{errors.confirmPassword && (
					<p className="mt-1 font-body text-[0.8125rem] text-[oklch(0.55_0.2_25)]">
						{errors.confirmPassword.message}
					</p>
				)}
			</div>

			{serverError && (
				<p className="font-body text-[0.875rem] text-[oklch(0.55_0.2_25)]">
					{serverError}
				</p>
			)}

			{savedOk && (
				<div className="flex items-center gap-2 font-body text-[0.875rem] text-tk-accent-emerald">
					<CheckCircle2 size={15} strokeWidth={2} />
					{s.password_success}
				</div>
			)}

			<button
				type="submit"
				disabled={isSubmitting}
				className={`tk-btn-primary justify-center ${isSubmitting ? "cursor-wait opacity-70" : ""}`}
			>
				{isSubmitting ? s.saving : s.update_password}
			</button>
		</form>
	);
}
