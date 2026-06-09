"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n";
import { getDict } from "@/i18n";

interface FooterProps {
	locale: Locale;
}

export function Footer({ locale }: FooterProps) {
	const d = getDict(locale);

	return (
		<footer className="mt-auto bg-tk-dark px-6 pt-16 pb-8 text-tk-on-dark">
			<div className="mx-auto max-w-7xl">
				<div className="mb-12 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-12">
					<div>
						<Image
							src="/logo-tkams.png"
							alt="TKAMS"
							width={120}
							height={36}
							className="mb-4 h-[30px] w-auto object-contain opacity-90"
						/>
						<p className="mb-3 font-body text-[0.9rem] text-tk-on-dark-soft leading-relaxed">
							{d.footer.tagline}
						</p>
						<p className="font-body text-[0.8125rem] text-tk-on-dark-soft">
							Développé par{" "}
							<a
								href="https://www.overbrand.net/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-tk-on-dark no-underline transition-colors duration-150 hover:text-tk-primary-bright"
							>
								OverBrand
							</a>
						</p>
						<p className="font-body text-[0.8125rem] text-tk-on-dark-soft">
							{d.footer.cities}
						</p>
					</div>

					<div>
						<h4 className="mb-4 font-code font-semibold text-[0.8125rem] text-tk-on-dark-soft uppercase tracking-[0.08em]">
							{d.footer.nav_title}
						</h4>
						<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
							{[
								{ href: "#features", label: d.footer.links.features },
								{ href: "#modules", label: d.footer.links.modules },
								{ href: "#pricing", label: d.footer.links.pricing },
								{ href: "/contact", label: d.footer.links.contact },
							].map((link) => (
								<li key={link.href}>
									<a
										href={link.href}
										className="font-body text-[0.9rem] text-tk-on-dark-soft no-underline transition-colors duration-150 hover:text-tk-on-dark"
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="mb-4 font-code font-semibold text-[0.8125rem] text-tk-on-dark-soft uppercase tracking-[0.08em]">
							{d.footer.legal_title}
						</h4>
						<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
							<li>
								<Link
									href="/legal/privacy"
									className="font-body text-[0.9rem] text-tk-on-dark-soft no-underline transition-colors duration-150 hover:text-tk-on-dark"
								>
									{d.footer.privacy}
								</Link>
							</li>
							<li>
								<Link
									href="/legal/terms"
									className="font-body text-[0.9rem] text-tk-on-dark-soft no-underline transition-colors duration-150 hover:text-tk-on-dark"
								>
									{d.footer.terms}
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="mb-4 font-code font-semibold text-[0.8125rem] text-tk-on-dark-soft uppercase tracking-[0.08em]">
							{d.footer.contact_title}
						</h4>
						<a
							href="mailto:contact@tkams.com"
							className="font-body text-[0.9rem] text-tk-primary-bright no-underline"
						>
							contact@tkams.com
						</a>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-white/8 border-t pt-6">
					<p className="font-body text-[0.8125rem] text-tk-on-dark-soft">
						© 2026{" "}
						<a
							href="https://www.overbrand.net/"
							target="_blank"
							rel="noopener noreferrer"
							className="no-underline transition-colors duration-150 hover:text-tk-on-dark"
						>
							OverBrand
						</a>
						{" · TKAMS"}
					</p>
					<p className="font-code text-[0.8125rem] text-[oklch(0.45_0.02_264)]">
						TKAMS · tkams.com
					</p>
				</div>
			</div>
		</footer>
	);
}
