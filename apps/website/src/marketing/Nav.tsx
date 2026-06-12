"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dict, Locale } from "@/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavProps {
	locale: Locale;
	dict?: Dict;
}

export function Nav({ locale, dict }: NavProps) {
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navLinks = dict
		? [
				{ href: "/produit", label: dict.nav.produit },
				{ href: "/solutions", label: dict.nav.solutions },
				{ href: "/tarifs", label: dict.nav.tarifs },
				{ href: "/posts", label: dict.nav.blog },
				{ href: "/contact", label: dict.nav.contact },
			]
		: [
				{ href: "/produit", label: locale === "en" ? "Product" : "Produit" },
				{ href: "/solutions", label: "Solutions" },
				{ href: "/tarifs", label: locale === "en" ? "Pricing" : "Tarifs" },
				{ href: "/posts", label: "Blog" },
				{ href: "/contact", label: "Contact" },
			];

	const demoLabel =
		dict?.nav.demo ??
		(locale === "en" ? "Get started" : "Démarrer gratuitement");

	return (
		<nav
			data-scrolled={scrolled}
			className="fixed top-0 right-0 left-0 z-50 border-transparent border-b bg-[oklch(0.955_0.006_80/0.7)] backdrop-blur-[16px] transition-all duration-300 data-[scrolled=true]:border-tk-border data-[scrolled=true]:bg-[oklch(0.955_0.006_80/0.92)]"
		>
			<div className="mx-auto flex h-[68px] max-w-[86rem] items-center justify-between gap-4 px-6 lg:px-10">
				<Link href="/" className="flex items-center gap-2.5 no-underline">
					<Image
						src="/logo-tkams.png"
						alt="TKAMS"
						width={120}
						height={36}
						className="h-8 w-auto object-contain"
						priority
					/>
				</Link>

				<div className="hidden flex-1 items-center justify-center gap-1 md:flex">
					{navLinks.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className="rounded-lg px-3.5 py-2 font-body font-medium text-[0.9rem] text-tk-ink-soft no-underline transition-colors duration-150 hover:bg-tk-bg-deep hover:text-tk-ink"
						>
							{link.label}
						</a>
					))}
				</div>

				<div className="flex items-center gap-3">
					<LanguageSwitcher locale={locale} />
					<Link
						href="/login"
						className="hidden items-center rounded-lg px-3.5 py-2 font-body font-medium text-[0.875rem] text-tk-ink-soft no-underline transition-colors duration-150 hover:bg-tk-bg-deep hover:text-tk-ink md:inline-flex"
					>
						{dict?.nav.login ?? (locale === "en" ? "Sign in" : "Connexion")}
					</Link>
					<Link
						href="/signup"
						className="tk-btn-primary"
						style={{ padding: "0.5625rem 1.25rem", fontSize: "0.875rem" }}
					>
						{demoLabel}
					</Link>
					<button
						onClick={() => setMenuOpen(!menuOpen)}
						aria-label="Toggle menu"
						className="flex cursor-pointer border-none bg-transparent p-2 text-tk-ink md:hidden"
					>
						<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
							{menuOpen ? (
								<path
									d="M4 4l14 14M18 4L4 18"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							) : (
								<path
									d="M3 6h16M3 11h16M3 16h16"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							)}
						</svg>
					</button>
				</div>
			</div>

			{menuOpen && (
				<div className="flex flex-col gap-1 border-tk-border border-t bg-tk-surface px-6 py-4">
					{navLinks.map((link) => (
						<a
							key={link.href}
							href={link.href}
							onClick={() => setMenuOpen(false)}
							className="rounded-lg px-4 py-3 font-medium text-base text-tk-ink no-underline transition-colors duration-150 hover:bg-tk-bg-deep"
						>
							{link.label}
						</a>
					))}
				</div>
			)}
		</nav>
	);
}
