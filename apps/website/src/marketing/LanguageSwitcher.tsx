"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Locale } from "@/i18n";
import { setLocale } from "@/i18n";

const LOCALES: { code: Locale; label: string }[] = [
	{ code: "fr", label: "Français" },
	{ code: "en", label: "English" },
];

export function LanguageSwitcher({ locale }: { locale: Locale }) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const select = (code: Locale) => {
		setOpen(false);
		if (code === locale) return;
		startTransition(async () => {
			await setLocale(code);
			window.location.reload();
		});
	};

	const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]!;

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen(!open)}
				disabled={isPending}
				aria-haspopup="listbox"
				aria-expanded={open}
				className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-lg border border-tk-border-strong bg-transparent px-2.5 py-1.5 font-code font-semibold text-[0.8rem] text-tk-ink-soft tracking-wide transition-all duration-150 hover:border-tk-primary hover:bg-tk-primary-soft hover:text-tk-primary disabled:cursor-wait"
			>
				<GlobeIcon />
				<span>{current.code.toUpperCase()}</span>
				<ChevronIcon open={open} />
			</button>

			{open && (
				<div className="absolute top-full right-0 z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-xl border border-tk-border bg-tk-surface shadow-[0_8px_24px_oklch(0_0_0/0.1)]">
					{LOCALES.map((l) => (
						<button
							key={l.code}
							onClick={() => select(l.code)}
							className={`flex w-full cursor-pointer items-center gap-2.5 border-none px-3.5 py-2.5 text-left font-body text-sm transition-colors duration-100 ${
								l.code === locale
									? "bg-tk-primary-soft font-semibold text-tk-primary"
									: "bg-transparent text-tk-ink-soft hover:bg-tk-bg-deep hover:text-tk-ink"
							}`}
						>
							<span className="w-5 shrink-0 font-bold font-code text-[0.7rem]">
								{l.code.toUpperCase()}
							</span>
							<span>{l.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function GlobeIcon() {
	return (
		<svg
			width="13"
			height="13"
			viewBox="0 0 14 14"
			fill="none"
			className="shrink-0 opacity-70"
		>
			<circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.25" />
			<ellipse
				cx="7"
				cy="7"
				rx="2.2"
				ry="5.5"
				stroke="currentColor"
				strokeWidth="1.25"
			/>
			<path
				d="M1.5 7h11"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function ChevronIcon({ open }: { open: boolean }) {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 10 10"
			fill="none"
			className={`shrink-0 opacity-60 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
		>
			<path
				d="M2 3.5l3 3 3-3"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
