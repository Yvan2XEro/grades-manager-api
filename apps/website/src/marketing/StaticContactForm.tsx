"use client";

import type React from "react";
import { useState } from "react";
import type { Dict } from "@/i18n";

const inputCls =
	"w-full rounded-[0.625rem] border border-tk-border bg-tk-surface px-4 py-3 font-body text-[0.9375rem] text-tk-ink outline-none transition-colors duration-150 focus:border-tk-primary focus:ring-2 focus:ring-tk-primary/15";
const labelCls = "mb-1.5 block font-body font-medium text-sm text-tk-ink-soft";

/**
 * Always-available contact form. Used when no Payload "Contact Form" record is
 * present. Submits via the visitor's email client (mailto) — no backend needed.
 */
export function StaticContactForm({ dict: d }: { dict: Dict }) {
	const f = d.contact.form;
	const [sent, setSent] = useState(false);

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		const name = String(data.get("name") ?? "");
		const institution = String(data.get("institution") ?? "");
		const email = String(data.get("email") ?? "");
		const phone = String(data.get("phone") ?? "");
		const message = String(data.get("message") ?? "");
		const subject = `TKAMS — ${name}${institution ? ` · ${institution}` : ""}`;
		const body = `${f.name}: ${name}\n${f.institution}: ${institution}\n${f.email}: ${email}\n${f.phone}: ${phone}\n\n${message}`;
		window.location.href = `mailto:contact@tkams.com?subject=${encodeURIComponent(
			subject,
		)}&body=${encodeURIComponent(body)}`;
		setSent(true);
	};

	return (
		<form
			onSubmit={onSubmit}
			className="flex flex-col gap-5 border border-tk-border bg-tk-surface p-7 sm:p-8"
		>
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<div>
					<label htmlFor="cf-name" className={labelCls}>
						{f.name}
					</label>
					<input
						id="cf-name"
						name="name"
						type="text"
						required
						className={inputCls}
					/>
				</div>
				<div>
					<label htmlFor="cf-inst" className={labelCls}>
						{f.institution}
					</label>
					<input
						id="cf-inst"
						name="institution"
						type="text"
						className={inputCls}
					/>
				</div>
				<div>
					<label htmlFor="cf-email" className={labelCls}>
						{f.email}
					</label>
					<input
						id="cf-email"
						name="email"
						type="email"
						required
						className={inputCls}
					/>
				</div>
				<div>
					<label htmlFor="cf-phone" className={labelCls}>
						{f.phone}
					</label>
					<input id="cf-phone" name="phone" type="tel" className={inputCls} />
				</div>
			</div>
			<div>
				<label htmlFor="cf-msg" className={labelCls}>
					{f.message}
				</label>
				<textarea
					id="cf-msg"
					name="message"
					required
					rows={5}
					placeholder={f.message_placeholder}
					className={`${inputCls} resize-y`}
				/>
			</div>
			<button type="submit" className="tk-btn-primary justify-center">
				{f.submit}
			</button>
			{sent && (
				<p className="font-body text-[0.875rem] text-tk-accent-emerald">
					{f.success}
				</p>
			)}
		</form>
	);
}
