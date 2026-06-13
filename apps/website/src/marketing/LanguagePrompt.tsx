"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { Locale } from "@/i18n";
import { setLocale } from "@/i18n";

/** Seconds before French is auto-selected if the visitor does nothing. */
const AUTO_SECONDS = 10;

/**
 * LanguagePrompt — first-visit language chooser.
 *
 * Rendered by the layout only when no explicit `tkams_locale` cookie is set.
 * Picking a language persists the cookie (via `setLocale`) and reloads so the
 * whole tree re-renders in the chosen locale.
 */

const OPTIONS: { code: Locale; label: string; native: string; flag: string }[] =
	[
		{ code: "fr", label: "French", native: "Français", flag: "FR" },
		{ code: "en", label: "English", native: "English", flag: "EN" },
	];

export function LanguagePrompt({ suggested = "fr" }: { suggested?: Locale }) {
	const [isPending, startTransition] = useTransition();
	const [picked, setPicked] = useState<Locale | null>(null);
	const [secondsLeft, setSecondsLeft] = useState(AUTO_SECONDS);

	const choose = useCallback((code: Locale) => {
		setPicked((prev) => prev ?? code);
		startTransition(async () => {
			await setLocale(code);
			window.location.reload();
		});
	}, []);

	// Auto-select French if the visitor hasn't picked before the countdown ends.
	useEffect(() => {
		if (picked) return;
		if (secondsLeft <= 0) {
			choose("fr");
			return;
		}
		const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
		return () => clearTimeout(id);
	}, [secondsLeft, picked, choose]);

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Choose your language"
			className="fixed inset-0 z-[100] flex items-center justify-center bg-[oklch(0.2_0.02_265/0.45)] px-5 backdrop-blur-sm"
		>
			<div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-tk-border bg-tk-surface shadow-[0_24px_60px_oklch(0_0_0/0.25)]">
				<div className="flex flex-col items-center border-tk-border border-b px-7 pt-8 pb-6 text-center">
					<span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-tk-border bg-tk-bg text-tk-primary">
						<GlobeIcon />
					</span>
					<h2 className="font-bold font-display text-[1.25rem] text-tk-ink tracking-[-0.02em]">
						Choisissez votre langue
					</h2>
					<p className="mt-1 font-body text-[0.9rem] text-tk-ink-2">
						Choose your language
					</p>
				</div>

				<div className="flex flex-col gap-2.5 p-5">
					{OPTIONS.map((o) => {
						const isSuggested = o.code === suggested;
						const isPicked = picked === o.code;
						return (
							<button
								key={o.code}
								type="button"
								disabled={isPending}
								onClick={() => choose(o.code)}
								className={`flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all duration-150 disabled:cursor-wait ${
									isPicked
										? "border-tk-primary bg-tk-primary-soft"
										: "border-tk-border bg-tk-bg hover:border-tk-primary hover:bg-tk-primary-soft"
								}`}
							>
								<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-tk-border bg-tk-surface font-bold font-code text-[0.7rem] text-tk-primary">
									{o.flag}
								</span>
								<span className="flex-1">
									<span className="block font-body font-semibold text-[0.95rem] text-tk-ink">
										{o.native}
									</span>
									<span className="block font-body text-[0.8rem] text-tk-muted">
										{o.label}
									</span>
								</span>
								{isSuggested ? (
									<span className="rounded-full bg-tk-primary-soft px-2 py-0.5 font-code font-semibold text-[0.65rem] text-tk-primary uppercase tracking-[0.08em]">
										Auto
									</span>
								) : null}
							</button>
						);
					})}
				</div>

				<div className="border-tk-border border-t px-5 py-4">
					<div className="flex items-center justify-between gap-3">
						<p className="font-body text-[0.78rem] text-tk-muted">
							Français par défaut dans{" "}
							<span className="font-code font-semibold text-tk-ink">
								{secondsLeft}s
							</span>{" "}
							· French in {secondsLeft}s
						</p>
						<button
							type="button"
							disabled={isPending}
							onClick={() => choose("fr")}
							className="font-code font-semibold text-[0.72rem] text-tk-primary uppercase tracking-[0.08em] transition-opacity duration-150 hover:opacity-70 disabled:cursor-wait"
						>
							Continuer
						</button>
					</div>
					<div className="mt-3 h-1 overflow-hidden rounded-full bg-tk-bg-deep">
						<div
							className="h-full rounded-full bg-tk-primary transition-[width] duration-1000 ease-linear"
							style={{
								width: `${(secondsLeft / AUTO_SECONDS) * 100}%`,
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function GlobeIcon() {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<circle
				cx="12"
				cy="12"
				r="9.25"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<ellipse
				cx="12"
				cy="12"
				rx="3.75"
				ry="9.25"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path
				d="M2.75 12h18.5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}
