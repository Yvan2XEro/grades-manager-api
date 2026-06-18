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

	const colTitle =
		"mb-4 font-code font-medium text-[0.7rem] text-tk-on-dark-muted uppercase tracking-[0.18em]";
	const link =
		"font-body text-[0.9rem] text-tk-on-dark-soft no-underline transition-colors duration-150 hover:text-tk-on-dark";

	return (
		<footer className="mt-auto bg-tk-dark text-tk-on-dark">
			<div className="mx-auto max-w-[86rem] px-6 pt-16 pb-8 lg:px-10">
				<div className="h-px w-full bg-white/12" />
				<div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-12">
					<div className="lg:col-span-5">
						<Image
							src="/logo-tkams-bg.png"
							alt="TKAMS"
							width={120}
							height={36}
							className="mb-5 h-[30px] w-auto object-contain opacity-90"
						/>
						<p className="mb-4 max-w-[40ch] font-body text-[0.9rem] text-tk-on-dark-soft leading-relaxed">
							{d.footer.tagline}
						</p>
						<p className="font-body text-[0.8125rem] text-tk-on-dark-muted">
							Développé par{" "}
							<a
								href="https://www.overbrand.net/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-tk-on-dark-soft no-underline transition-colors duration-150 hover:text-tk-primary-bright"
							>
								OverBrand
							</a>
							{" · "}
							{d.footer.cities}
						</p>
					</div>

					<div className="lg:col-span-2 lg:col-start-7">
						<h4 className={colTitle}>{d.footer.nav_title}</h4>
						<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
							{[
								{ href: "/produit", label: d.footer.links.produit },
								{ href: "/solutions", label: d.footer.links.solutions },
								{ href: "/tarifs", label: d.footer.links.tarifs },
								{ href: "/about", label: d.footer.links.about },
								{ href: "/posts", label: d.footer.links.blog },
								{ href: "/contact", label: d.footer.links.contact },
							].map((l) => (
								<li key={l.href}>
									<Link href={l.href} className={link}>
										{l.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div className="lg:col-span-2">
						<h4 className={colTitle}>{d.footer.legal_title}</h4>
						<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
							<li>
								<Link href="/legal/privacy" className={link}>
									{d.footer.privacy}
								</Link>
							</li>
							<li>
								<Link href="/legal/terms" className={link}>
									{d.footer.terms}
								</Link>
							</li>
						</ul>
					</div>

					<div className="lg:col-span-2">
						<h4 className={colTitle}>{d.footer.contact_title}</h4>
						<a
							href="mailto:contact@tkams.com"
							className="font-body text-[0.9rem] text-tk-primary-bright no-underline"
						>
							contact@tkams.com
						</a>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-white/10 border-t pt-6">
					<p className="font-body text-[0.8125rem] text-tk-on-dark-muted">
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
					<p className="font-code text-[0.8125rem] text-tk-on-dark-muted">
						tkams.com
					</p>
				</div>
			</div>
		</footer>
	);
}
