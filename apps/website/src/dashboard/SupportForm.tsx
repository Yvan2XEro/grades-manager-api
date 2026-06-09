"use client";

import type React from "react";
import { useState } from "react";
import type { Dict } from "@/i18n";
import type { User } from "@/payload-types";

const inputCls =
	"w-full py-3 px-4 bg-tk-bg border border-tk-border rounded-[0.625rem] text-tk-ink text-[0.9375rem] font-body outline-none transition-colors duration-150 focus:border-tk-primary box-border";
const labelCls = "block text-tk-ink-soft text-sm font-medium mb-1.5 font-body";

export function SupportForm({ user, dict: d }: { user: User; dict: Dict }) {
	const s = d.dashboard.support;
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSending(true);
		setError("");
		try {
			const res = await fetch("/api/support", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					subject,
					message,
					from: user.email,
					name: user.name,
				}),
			});
			if (res.ok) {
				setSent(true);
				setSubject("");
				setMessage("");
			} else {
				setError("An error occurred. Please try again or contact us directly.");
			}
		} finally {
			setSending(false);
		}
	};

	if (sent) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-[1rem] border border-tk-border bg-tk-surface p-6 text-center">
				<div className="flex h-10 w-10 items-center justify-center rounded-full border border-tk-accent-emerald/40 bg-[oklch(0.58_0.17_149/0.1)]">
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-tk-accent-emerald"
					>
						<path d="M3 9l4 4 8-8" />
					</svg>
				</div>
				<p className="font-body font-semibold text-tk-ink">{s.success}</p>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-5 rounded-[1rem] border border-tk-border bg-tk-surface p-6"
		>
			<div>
				<label className={labelCls}>{s.subject}</label>
				<input
					type="text"
					value={subject}
					onChange={(e) => setSubject(e.target.value)}
					className={inputCls}
					required
				/>
			</div>
			<div>
				<label className={labelCls}>{s.message}</label>
				<textarea
					rows={5}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder={s.message_placeholder}
					className={`${inputCls} resize-none`}
					required
				/>
			</div>
			{error && (
				<p className="font-body text-[0.875rem] text-[oklch(0.55_0.2_25)]">
					{error}
				</p>
			)}
			<button
				type="submit"
				disabled={sending}
				className={`tk-btn-primary justify-center ${sending ? "cursor-wait opacity-70" : ""}`}
			>
				{sending ? s.submitting : s.submit}
			</button>
		</form>
	);
}
