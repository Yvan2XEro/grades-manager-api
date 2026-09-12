"use client";

import { Mail } from "lucide-react";
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
		"mb-4 font-code font-medium text-[length:var(--tk-text-xs)] text-tk-on-dark-muted uppercase tracking-[0.18em]";
	/*
	 * Links shift 2px right on hover rather than only changing colour. On a dark
	 * panel a colour change alone is easy to miss; the small displacement makes
	 * the target feel live without underlining twenty items.
	 */
	const link =
		"inline-block font-body text-[length:var(--tk-text-body)] text-tk-on-dark-soft no-underline transition-all duration-150 hover:translate-x-0.5 hover:text-tk-on-dark";

	return (
		<footer className="relative mt-auto overflow-hidden bg-tk-dark text-tk-on-dark">
			{/*
			 * The lattice, dimmed to a third and faded out downward.
			 *
			 * It is dimmed here rather than in `.tk-field-weave--on-dark` itself
			 * because that class is shared with the violet chapters, where it sits
			 * on a lighter ground and needs its full strength. The footer is the
			 * darkest surface on the site, so the same alpha read far stronger here
			 * and competed with the link columns.
			 *
			 * The mask lets it hold the top edge, where the eye lands, and dissolve
			 * before the legal line at the bottom.
			 */}
			<div
				aria-hidden="true"
				className="tk-field-weave--on-dark pointer-events-none absolute inset-0 opacity-35 [mask-image:linear-gradient(180deg,#000,transparent_70%)]"
			/>

			{/*
			 * A single wash of brand violet behind the masthead corner, the same
			 * device the page uses under its hero. It stops the footer reading as a
			 * flat slab without adding a border or a second colour.
			 */}
			<div
				aria-hidden="true"
				className="-left-32 -top-24 pointer-events-none absolute h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,oklch(0.585_0.229_277/0.22),transparent_68%)]"
			/>

			<div className="relative mx-auto max-w-[86rem] px-6 pt-16 pb-8 lg:px-10">
				<div className="grid grid-cols-1 gap-12 pb-12 lg:grid-cols-12">
					<div className="lg:col-span-5">
						<Image
							src="/logo-tkams-bg.png"
							alt="TKAMS"
							width={120}
							height={36}
							className="mb-6 h-[30px] w-auto object-contain"
						/>

						{/*
						 * The tagline set as a statement rather than as small print.
						 * A footer's first column is the last thing a visitor reads on the
						 * site; giving it display type costs nothing and stops the whole
						 * panel reading as a list of links.
						 */}
						<p className="mb-6 max-w-[22ch] font-display font-semibold text-[1.35rem] text-tk-on-dark leading-[1.25] tracking-[-0.02em]">
							{d.footer.tagline}
						</p>

						{/* The last call to action, where a convinced reader ends up. */}
						<Link
							href="/contact"
							className="inline-flex items-center gap-2 rounded-md bg-tk-on-dark px-5 py-3 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-dark no-underline transition-colors hover:bg-tk-primary-bright"
						>
							{en ? "Request a demo" : "Demander une démo"}
							<span aria-hidden="true">→</span>
						</Link>

						<p className="mt-7 font-body text-[length:var(--tk-text-sm)] text-tk-on-dark-muted">
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
						{/*
						 * The email is the one thing in this panel a visitor may want to
						 * act on immediately, so it is given a surface rather than being
						 * one more coloured line among twenty links.
						 */}
						<a
							href="mailto:contact@tkams.com"
							className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.04] px-3.5 py-2.5 font-body text-[length:var(--tk-text-body)] text-tk-on-dark no-underline transition-colors hover:border-white/30 hover:bg-white/[0.08]"
						>
							<Mail size={15} aria-hidden="true" className="opacity-70" />
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
					<p className="font-body text-[length:var(--tk-text-sm)] text-tk-on-dark-muted">
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
					<p className="font-code text-[length:var(--tk-text-sm)] text-tk-on-dark-muted">
						tkams.com
					</p>
				</div>
			</div>
		</footer>
	);
}
