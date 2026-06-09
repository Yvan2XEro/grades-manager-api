"use client";

import type React from "react";
import { useState } from "react";
import type { Dict } from "@/i18n";

const inputCls =
	"w-full py-3 px-4 bg-tk-bg border border-tk-border rounded-[0.625rem] text-tk-ink text-[0.9375rem] font-body outline-none transition-colors duration-150 focus:border-tk-primary box-border";
const labelCls = "block text-tk-ink-soft text-sm font-medium mb-1.5 font-body";

export function PasswordForm({ dict: d }: { dict: Dict }) {
	const s = d.dashboard.settings;
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState("");

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (newPassword !== confirmPassword) {
			setError(d.register.errors.password_mismatch);
			return;
		}
		if (newPassword.length < 8) {
			setError(d.register.errors.password_min);
			return;
		}
		setSaving(true);
		setSaved(false);
		try {
			const res = await fetch("/api/users/change-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ currentPassword, newPassword }),
			});
			if (res.ok) {
				setSaved(true);
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
				setTimeout(() => setSaved(false), 3000);
			} else {
				const data = await res.json();
				setError(data.error ?? "Error updating password.");
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
				<label className={labelCls}>{s.current_password}</label>
				<input
					type="password"
					value={currentPassword}
					onChange={(e) => setCurrentPassword(e.target.value)}
					className={inputCls}
					required
				/>
			</div>
			<div>
				<label className={labelCls}>{s.new_password}</label>
				<input
					type="password"
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
					className={inputCls}
					required
					minLength={8}
				/>
			</div>
			<div>
				<label className={labelCls}>{s.confirm_password}</label>
				<input
					type="password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					className={inputCls}
					required
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
				{saving ? s.saving : s.update_password}
			</button>
		</form>
	);
}
