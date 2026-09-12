"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Locale } from "@/i18n";
import { setLocale } from "@/i18n";
import { FlagEN, FlagFR } from "./Flags";

/**
 * Language switcher.
 *
 * Each locale carries its flag, its code and its endonym — the language's name
 * in itself ("Français", not "French"), because a visitor looking for their own
 * language scans for the word they already know.
 *
 * The flag is decorative and never stands alone: a flag names a country, not a
 * language, so the code (FR / EN) is always beside it. Screen readers get the
 * name from the option text, not from the drawing.
 *
 * Keyboard support is deliberate, not incidental. The trigger is a real
 * `combobox`, the list is a `listbox`, and arrows, Home/End, Enter and Escape
 * all behave the way a native select does — the previous version could only be
 * operated with a mouse, and trapped keyboard users on whichever language they
 * happened to land on.
 */

const LOCALES: {
	code: Locale;
	/** The language's name in its own language. */
	label: string;
	Flag: typeof FlagFR;
}[] = [
	{ code: "fr", label: "Français", Flag: FlagFR },
	{ code: "en", label: "English", Flag: FlagEN },
];

export function LanguageSwitcher({ locale }: { locale: Locale }) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [activeIndex, setActiveIndex] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

	const currentIndex = Math.max(
		0,
		LOCALES.findIndex((l) => l.code === locale),
	);
	const current = LOCALES[currentIndex] ?? LOCALES[0]!;

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	/** Move real focus onto the active option so screen readers follow along. */
	useEffect(() => {
		if (open) optionRefs.current[activeIndex]?.focus();
	}, [open, activeIndex]);

	const openMenu = (startAt = currentIndex) => {
		setActiveIndex(startAt);
		setOpen(true);
	};

	const closeMenu = (refocus = true) => {
		setOpen(false);
		if (refocus) triggerRef.current?.focus();
	};

	const select = (code: Locale) => {
		closeMenu();
		if (code === locale) return;
		startTransition(async () => {
			await setLocale(code);
			// The dictionary is resolved on the server from the cookie, so the
			// whole tree has to be re-rendered against the new locale.
			window.location.reload();
		});
	};

	const onTriggerKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			openMenu();
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			openMenu(LOCALES.length - 1);
		}
	};

	const onOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setActiveIndex((index + 1) % LOCALES.length);
				break;
			case "ArrowUp":
				e.preventDefault();
				setActiveIndex((index - 1 + LOCALES.length) % LOCALES.length);
				break;
			case "Home":
				e.preventDefault();
				setActiveIndex(0);
				break;
			case "End":
				e.preventDefault();
				setActiveIndex(LOCALES.length - 1);
				break;
			case "Escape":
				e.preventDefault();
				closeMenu();
				break;
			case "Tab":
				setOpen(false);
				break;
			default:
				break;
		}
	};

	return (
		<div ref={ref} className="relative">
			<button
				ref={triggerRef}
				type="button"
				onClick={() => (open ? closeMenu(false) : openMenu())}
				onKeyDown={onTriggerKeyDown}
				disabled={isPending}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-label={`${current.label} — ${
					locale === "en" ? "change language" : "changer de langue"
				}`}
				className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-md border border-tk-border-strong bg-transparent py-1.5 pr-2 pl-2 font-body font-semibold text-[0.8rem] text-tk-ink-soft transition-colors duration-150 hover:border-tk-primary hover:bg-tk-primary-soft hover:text-tk-primary-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-ink focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
			>
				<current.Flag size={18} />
				<span className="font-code tracking-wide">
					{current.code.toUpperCase()}
				</span>
				<ChevronIcon open={open} />
			</button>

			{/*
			 * A listbox of buttons rather than a native <select>: a native option
			 * cannot carry flag artwork.
			 */}
			{open && (
				<div
					role="listbox"
					aria-label={locale === "en" ? "Language" : "Langue"}
					className="absolute top-full right-0 z-50 mt-1.5 min-w-[176px] overflow-hidden rounded-lg border border-tk-border bg-tk-surface py-1 shadow-[0_16px_36px_oklch(0.19_0.026_277/0.14)]"
				>
					{LOCALES.map((l, i) => {
						const isCurrent = l.code === locale;
						return (
							<button
								key={l.code}
								ref={(el) => {
									optionRefs.current[i] = el;
								}}
								type="button"
								role="option"
								aria-selected={isCurrent}
								tabIndex={i === activeIndex ? 0 : -1}
								onClick={() => select(l.code)}
								onKeyDown={(e) => onOptionKeyDown(e, i)}
								onMouseEnter={() => setActiveIndex(i)}
								className={`focus-visible:-outline-offset-2 flex w-full cursor-pointer items-center gap-2.5 border-none px-3 py-2.5 text-left font-body text-[0.875rem] transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-tk-ink ${
									isCurrent
										? "bg-tk-primary-soft font-semibold text-tk-primary-deep"
										: "bg-transparent text-tk-ink-2 hover:bg-tk-bg-deep hover:text-tk-ink"
								}`}
							>
								<l.Flag size={20} />
								<span className="flex-1">{l.label}</span>
								<span className="font-code text-[0.7rem] text-tk-muted tracking-wide">
									{l.code.toUpperCase()}
								</span>
								{isCurrent ? <CheckIcon /> : null}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

function ChevronIcon({ open }: { open: boolean }) {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 10 10"
			fill="none"
			aria-hidden="true"
			className={`shrink-0 opacity-60 transition-transform duration-150 ${
				open ? "rotate-180" : ""
			}`}
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

function CheckIcon() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
			className="shrink-0"
		>
			<path
				d="M2.5 6.2l2.4 2.4 4.6-5"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
