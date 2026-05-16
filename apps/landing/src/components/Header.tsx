import { Check, ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import ThemeToggle from "./ThemeToggle";

const APP_URL = "https://app.tkams.com";

const LANGS = [
	{ code: "fr" as const, label: "Français", flag: "🇫🇷" },
	{ code: "en" as const, label: "English", flag: "🇬🇧" },
];

function LangDropdown() {
	const { lang, setLang } = useI18n();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		function onPointerDown(e: PointerEvent) {
			if (!ref.current?.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [open]);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="hover:-translate-y-0.5 flex h-8 items-center gap-1.5 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] pr-2 pl-2.5 font-semibold text-[var(--sea-ink)] text-xs shadow-[0_4px_12px_rgba(91,62,207,0.08)] transition hover:border-[var(--lagoon-deep)] hover:text-[var(--lagoon-deep)]"
				aria-label="Change language"
			>
				<span className="text-sm leading-none">{current.flag}</span>
				<span className="font-bold uppercase tracking-wide">
					{current.code}
				</span>
				<ChevronDown
					className="h-3 w-3 transition-transform duration-200"
					style={{ transform: open ? "rotate(180deg)" : "none" }}
					strokeWidth={2.5}
				/>
			</button>

			{open && (
				<div className="lang-dropdown">
					{LANGS.map((l) => (
						<button
							key={l.code}
							type="button"
							onClick={() => {
								setLang(l.code);
								setOpen(false);
							}}
							className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-medium text-sm transition hover:bg-[var(--sand)]"
							style={{
								color:
									l.code === lang
										? "var(--lagoon-deep)"
										: "var(--sea-ink-soft)",
							}}
						>
							<span className="text-base">{l.flag}</span>
							<span className="flex-1">{l.label}</span>
							{l.code === lang && (
								<Check
									className="h-3.5 w-3.5"
									strokeWidth={2.5}
									style={{ color: "var(--lagoon-deep)" }}
								/>
							)}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export default function Header() {
	const { t } = useI18n();
	const [open, setOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 24);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const isDark =
		typeof document !== "undefined" &&
		document.documentElement.classList.contains("dark");
	const logoSrc = isDark ? "/logo-bg.png" : "/logo.png";

	const links = [
		{ href: "#features", label: t("nav.features") },
		{ href: "#screenshots", label: t("nav.screenshots") },
		{ href: "#pricing", label: t("nav.pricing") },
		{ href: "#about", label: t("nav.about") },
	];

	function handleNav(href: string) {
		setOpen(false);
		if (href.startsWith("#")) {
			const el = document.getElementById(href.slice(1));
			el?.scrollIntoView({ behavior: "smooth" });
		}
	}

	return (
		<header
			className="sticky top-0 z-50 border-b px-4 backdrop-blur-lg transition-all duration-300"
			style={{
				borderColor: scrolled ? "var(--line)" : "transparent",
				background: scrolled ? "var(--header-bg)" : "transparent",
				boxShadow: scrolled ? "0 4px 24px rgba(91,62,207,0.06)" : "none",
			}}
		>
			<nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
				{/* Logo */}
				<a
					href="/"
					className="hover:-translate-y-0.5 flex flex-shrink-0 no-underline transition"
				>
					<img src={logoSrc} alt="TKAMS" className="h-6 w-auto" />
				</a>

				{/* Desktop nav */}
				<div className="order-3 hidden items-center gap-x-5 pb-1 font-semibold text-sm sm:order-none sm:flex sm:pb-0">
					{links.map((l) => (
						<button
							key={l.href}
							type="button"
							onClick={() => handleNav(l.href)}
							className="nav-link cursor-pointer border-0 bg-transparent p-0 font-semibold"
						>
							{l.label}
						</button>
					))}
				</div>

				{/* Right actions */}
				<div className="ml-auto flex items-center gap-2">
					<LangDropdown />
					<ThemeToggle />

					<a
						href={APP_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="hover:-translate-y-0.5 hidden rounded-full px-4 py-2 font-semibold text-sm no-underline transition sm:block"
						style={{
							background: "#5b3ecf",
							color: "#fff",
							boxShadow: "0 4px 14px rgba(91,62,207,0.28)",
						}}
					>
						{t("nav.login")}
					</a>

					<button
						type="button"
						className="rounded-lg p-1.5 text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)] sm:hidden"
						onClick={() => setOpen((v) => !v)}
						aria-label="Toggle menu"
					>
						{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>

				{/* Mobile menu */}
				{open && (
					<div className="order-last w-full border-[var(--line)] border-t pt-4 pb-3 sm:hidden">
						<div className="flex flex-col gap-3">
							{links.map((l) => (
								<button
									key={l.href}
									type="button"
									onClick={() => handleNav(l.href)}
									className="nav-link cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-sm"
								>
									{l.label}
								</button>
							))}
							<a
								href={APP_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-1 inline-flex w-fit rounded-full px-4 py-2 font-semibold text-sm no-underline"
								style={{ background: "#5b3ecf", color: "#fff" }}
							>
								{t("nav.login")}
							</a>
						</div>
					</div>
				)}
			</nav>
		</header>
	);
}
