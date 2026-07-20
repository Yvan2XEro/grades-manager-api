"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import type { Dict } from "@/i18n";
import type { User } from "@/payload-types";
import { cn } from "@/utilities/ui";

type FormData = { name: string };

const inputCls =
	"w-full rounded-[0.625rem] border border-tk-border bg-tk-bg px-4 py-3 font-body text-[0.9375rem] text-tk-ink outline-none transition-colors focus:border-tk-primary disabled:cursor-not-allowed disabled:opacity-50";

export function ProfileForm({ user, dict: d }: { user: User; dict: Dict }) {
	const s = d.dashboard.settings;
	const [savedOk, setSavedOk] = useState(false);
	const [serverError, setServerError] = useState("");

	const {
		register,
		handleSubmit,
		formState: { isSubmitting, errors },
	} = useForm<FormData>({
		defaultValues: { name: user.name ?? "" },
	});

	const onSubmit = async (data: FormData) => {
		setSavedOk(false);
		setServerError("");
		const res = await fetch(`/api/users/${user.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ name: data.name }),
		});
		if (res.ok) {
			setSavedOk(true);
			setTimeout(() => setSavedOk(false), 4000);
		} else {
			setServerError("Error saving profile.");
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-5 rounded-[1rem] border border-tk-border bg-tk-surface p-6"
		>
			<div>
				<Label className="mb-1.5 block font-body font-medium text-[0.875rem] text-tk-ink-soft">
					{s.name_label}
				</Label>
				<input
					type="text"
					{...register("name", { required: d.register.errors.required })}
					className={cn(
						inputCls,
						errors.name && "border-[oklch(0.65_0.2_25/0.5)]",
					)}
				/>
				{errors.name && (
					<p className="mt-1 font-body text-[0.8125rem] text-[oklch(0.55_0.2_25)]">
						{errors.name.message}
					</p>
				)}
			</div>

			<div>
				<Label className="mb-1.5 block font-body font-medium text-[0.875rem] text-tk-ink-soft">
					{s.email_label}
				</Label>
				<input
					type="email"
					value={user.email ?? ""}
					disabled
					className={cn(inputCls, "cursor-not-allowed opacity-50")}
				/>
				<p className="mt-1 font-body text-[0.75rem] text-tk-muted">
					{s.email_hint}
				</p>
			</div>

			{serverError && (
				<p className="font-body text-[0.875rem] text-[oklch(0.55_0.2_25)]">
					{serverError}
				</p>
			)}

			{savedOk && (
				<div className="flex items-center gap-2 font-body text-[0.875rem] text-tk-accent-emerald">
					<CheckCircle2 size={15} strokeWidth={2} />
					{s.saved}
				</div>
			)}

			<button
				type="submit"
				disabled={isSubmitting}
				className={`tk-btn-primary justify-center ${isSubmitting ? "cursor-wait opacity-70" : ""}`}
			>
				{isSubmitting ? s.saving : s.save}
			</button>
		</form>
	);
}
