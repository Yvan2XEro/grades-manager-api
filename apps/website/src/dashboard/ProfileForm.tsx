"use client";

import type React from "react";
import { useState } from "react";
import type { Dict } from "@/i18n";
import type { User } from "@/payload-types";

const inputCls =
	"w-full py-3 px-4 bg-tk-bg border border-tk-border rounded-[0.625rem] text-tk-ink text-[0.9375rem] font-body outline-none transition-colors duration-150 focus:border-tk-primary box-border";
const labelCls = "block text-tk-ink-soft text-sm font-medium mb-1.5 font-body";

export function ProfileForm({ user, dict: d }: { user: User; dict: Dict }) {
	const s = d.dashboard.settings;
	const [name, setName] = useState(user.name ?? "");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState("");

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setSaved(false);
		setError("");
		try {
			const res = await fetch(`/api/users/${user.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ name }),
			});
			if (res.ok) {
				setSaved(true);
				setTimeout(() => setSaved(false), 3000);
			} else {
				setError("Error saving profile.");
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<form
			onSubmit={handleSave}
			className="flex flex-col gap-5 rounded-[1rem] border border-tk-border bg-tk-surface p-6"
		>
			<div>
				<label className={labelCls}>{s.name_label}</label>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className={inputCls}
				/>
			</div>
			<div>
				<label className={labelCls}>{s.email_label}</label>
				<input
					type="email"
					value={user.email ?? ""}
					disabled
					className={`${inputCls} cursor-not-allowed opacity-50`}
				/>
			</div>
			{error && (
				<p className="font-body text-[0.875rem] text-[oklch(0.55_0.2_25)]">
					{error}
				</p>
			)}
			{saved && (
				<p className="font-body text-[0.875rem] text-tk-accent-emerald">
					✓ {s.saved}
				</p>
			)}
			<button
				type="submit"
				disabled={saving}
				className={`tk-btn-primary justify-center ${saving ? "cursor-wait opacity-70" : ""}`}
			>
				{saving ? s.saving : s.save}
			</button>
		</form>
	);
}
