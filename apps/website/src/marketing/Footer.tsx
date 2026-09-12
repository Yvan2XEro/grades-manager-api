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
	const en = locale === "en";

	const colTitle =
		"mb-4 font-code font-medium text-[0.7rem] text-tk-on-dark-muted uppercase tracking-[0.18em]";
	const link =
		"font-body text-[0.9rem] text-tk-on-dark-soft no-underline transition-colors duration-150 hover:text-tk-on-dark";

	return (
		<footer className="relative mt-auto overflow-hidden bg-tk-dark text-tk-on-dark">
			{/* Mudcloth lattice across the panel, at watermark strength. */}
			<div
				aria-hidden="true"
				className="tk-field-weave--on-dark pointer-events-none absolute inset-0"
			/>

			<div className="relative mx-auto max-w-[86rem] px-6 pt-16 pb-8 lg:px-10">
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

					{/*
					 * Three link columns rather than one.
					 *
					 * The footer used to carry a single six-item list, which left three
					 * of the richest pages on the site — engagements, comparatif and
					 * onreceipt — reachable from nowhere but the nav's hover panel. A
					 * footer is the site map of last resort; it should hold every page
					 * a visitor might be hunting for.
					 */}
					<div className="lg:col-span-2 lg:col-start-6">
						<h4 className={colTitle}>{en ? "Product" : "Produit"}</h4>
						<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
							{[
								{
									href: "/produit",
									label: en ? "TKAMS · Higher education" : "TKAMS · Supérieur",
								},
								{
									href: "/secondaire",
									label: en ? "TKAMS · Secondary" : "TKAMS · Secondaire",
								},
								{
									href: "/fonctionnalites",
									label: d.footer.links.features,
								},
								{ href: "/securite", label: en ? "Security" : "Sécurité" },
								{
									href: "/integrations",
									label: en ? "Integrations" : "Intégrations",
								},
								{ href: "/onreceipt", label: "QR Code OnReceipt" },
								{
									href: "/comparatif",
									label: en ? "Compare" : "Comparatif",
								},
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
						<h4 className={colTitle}>{en ? "Company" : "Entreprise"}</h4>
						<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
							{[
								{ href: "/solutions", label: d.footer.links.solutions },
								{ href: "/tarifs", label: d.footer.links.tarifs },
								{
									href: "/engagements",
									label: en ? "Commitments" : "Engagements",
								},
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

					<div className="lg:col-span-3">
						<h4 className={colTitle}>{d.footer.contact_title}</h4>
						<a
							href="mailto:contact@tkams.com"
							className="font-body text-[0.9rem] text-tk-primary-bright no-underline"
						>
							contact@tkams.com
						</a>

						<h4 className={`${colTitle} mt-8`}>{d.footer.legal_title}</h4>
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
