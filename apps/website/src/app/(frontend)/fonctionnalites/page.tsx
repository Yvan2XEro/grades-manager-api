import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/i18n";
import {
	CAPABILITY_DOMAINS,
	NOT_IN_PRODUCT,
} from "@/marketing/capabilities-2026";
import { DomainDemo } from "@/marketing/DomainDemo";
import { Cta } from "@/marketing/sections/Cta";

/**
 * Functional coverage — the page the homepage has been promising.
 *
 * `dict.domains.link` reads "Voir les 45 modules →" and pointed at /produit,
 * which describes nine domains in a paragraph each and lists no modules at
 * all. This page is that destination: every capability the server actually
 * implements, grouped by domain, with the four live demos that were built and
 * then never shown to anyone.
 *
 * Two decisions worth recording, because both cost surface area on purpose:
 *
 *   1. Nothing here is aspirational. `capabilities-2026.ts` was written from
 *      the module tree, and three claims the commercial proposal makes are
 *      qualified in place rather than repeated — the QR code carries data but
 *      opens nothing, payments are recorded rather than collected online, and
 *      resits ship switched off. A prospect who discovers a softened claim
 *      after signing costs more than one who reads it here.
 *
 *   2. The page ends on what the product does NOT do. That section is the
 *      reason the rest is believable, and it is the same move the pricing page
 *      already makes with "ce qui n'est pas inclus".
 */
export default async function FonctionnalitesPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const en = locale === "en";

	const total = CAPABILITY_DOMAINS.reduce(
		(n, d) => n + d.capabilities.length,
		0,
	);

	return (
		<main className="bg-tk-bg pt-[68px]">
			{/* Masthead */}
			<section className="border-tk-border border-b">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<p className="font-code text-[0.7rem] text-tk-eyebrow uppercase tracking-[0.16em]">
						{en ? "Functional coverage" : "Couverture fonctionnelle"}
					</p>
					<h1 className="mt-4 max-w-[22ch] font-display font-extrabold text-[clamp(2rem,1.3rem+2.6vw,3.25rem)] text-tk-title leading-[1.04] tracking-[-0.035em]">
						{en
							? "Everything the platform does. Listed, not summarised."
							: "Tout ce que la plateforme fait. Énuméré, pas résumé."}
					</h1>
					<p className="mt-5 max-w-[58ch] font-body text-[1.05rem] text-tk-ink-2 leading-relaxed">
						{en
							? `${total} capabilities across nine domains, each one verified against the source code rather than transcribed from a brochure. Where a capability is narrower than its usual name suggests, it says so on the line.`
							: `${total} capacités réparties sur neuf domaines, chacune vérifiée dans le code source plutôt que reprise d'une plaquette. Quand une capacité est plus étroite que son nom le laisse croire, c'est écrit sur la ligne.`}
					</p>

					{/* Domain jump links */}
					<nav
						aria-label={en ? "Domains" : "Domaines"}
						className="mt-8 flex flex-wrap gap-2"
					>
						{CAPABILITY_DOMAINS.map((d) => (
							<a
								key={d.key}
								href={`#${d.key}`}
								className="rounded-full border border-tk-border-strong bg-tk-surface px-3.5 py-1.5 font-body font-medium text-[0.8rem] text-tk-ink-2 no-underline transition-colors hover:border-tk-primary hover:text-tk-primary-deep"
							>
								{en ? d.en.name : d.fr.name}
							</a>
						))}
					</nav>
				</div>
			</section>

			{/* One chapter per domain */}
			{CAPABILITY_DOMAINS.map((domain, i) => {
				const copy = en ? domain.en : domain.fr;
				const shaded = i % 2 === 1;

				return (
					<section
						key={domain.key}
						id={domain.key}
						className={`scroll-mt-[84px] border-tk-border border-b ${
							shaded ? "bg-tk-bg-deep" : "bg-tk-bg"
						}`}
					>
						<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
							<div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
								{/* Sticky domain header */}
								<div className="lg:col-span-4">
									<div className="lg:sticky lg:top-28">
										<span className="font-code text-[0.7rem] text-tk-muted tabular-nums">
											{String(i + 1).padStart(2, "0")}
										</span>
										<h2 className="mt-3 max-w-[16ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.5vw,2.1rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
											{copy.name}
										</h2>
										<p className="mt-4 max-w-[38ch] font-body text-[0.95rem] text-tk-ink-2 leading-[1.7]">
											{copy.lede}
										</p>
										<p className="mt-5 font-code text-[0.7rem] text-tk-eyebrow uppercase tracking-[0.14em]">
											{domain.capabilities.length}{" "}
											{en ? "capabilities" : "capacités"}
										</p>
									</div>
								</div>

								{/* Capability list */}
								<div className="min-w-0 lg:col-span-8">
									<ul className="m-0 list-none p-0">
										{domain.capabilities.map((c) => (
											<li
												key={en ? c.en : c.fr}
												className="flex items-start gap-3.5 border-tk-border border-t py-4 last:border-b"
											>
												<span
													aria-hidden="true"
													className="mt-[0.55rem] h-1.5 w-1.5 flex-none rounded-full bg-tk-primary"
												/>
												<div className="min-w-0">
													<p className="font-body text-[0.9375rem] text-tk-ink leading-[1.6]">
														{en ? c.en : c.fr}
													</p>
													{c.note && (
														<p className="mt-1.5 max-w-[62ch] font-body text-[0.8125rem] text-tk-muted leading-[1.6]">
															{en ? c.note.en : c.note.fr}
														</p>
													)}
												</div>
											</li>
										))}
									</ul>

									{domain.demo && (
										<div className="mt-10 min-w-0">
											<DomainDemo which={domain.demo} dict={dict} />
										</div>
									)}
								</div>
							</div>
						</div>
					</section>
				);
			})}

			{/* What it does not do */}
			<section className="relative overflow-hidden bg-tk-dark text-tk-on-dark">
				<div
					aria-hidden="true"
					className="tk-field-weave--on-dark pointer-events-none absolute inset-0 opacity-60"
				/>
				<div className="relative mx-auto max-w-[86rem] px-6 py-16 lg:px-10 lg:py-24">
					<div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<p className="font-code text-[0.7rem] text-tk-on-dark-muted uppercase tracking-[0.16em]">
								{en ? "The other list" : "L'autre liste"}
							</p>
							<h2 className="mt-4 max-w-[18ch] font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] leading-[1.08] tracking-[-0.03em]">
								{en ? "What TKAMS does not do." : "Ce que TKAMS ne fait pas."}
							</h2>
							<p className="mt-4 max-w-[42ch] font-body text-[0.95rem] text-tk-on-dark-soft leading-[1.7]">
								{en
									? "A coverage page that only lists strengths teaches you nothing. These are the boundaries, stated before you ask."
									: "Une page de couverture qui n'énumère que des forces n'apprend rien. Voici les limites, écrites avant que vous les demandiez."}
							</p>
						</div>

						<div className="lg:col-span-7">
							<ul className="m-0 list-none p-0">
								{(en ? NOT_IN_PRODUCT.en : NOT_IN_PRODUCT.fr).map((line) => (
									<li
										key={line}
										className="flex items-start gap-3.5 border-tk-on-dark-muted/20 border-t py-4 last:border-b"
									>
										<span
											aria-hidden="true"
											className="mt-[0.5rem] h-px w-3.5 flex-none bg-tk-on-dark-muted"
										/>
										<p className="max-w-[58ch] font-body text-[0.9375rem] text-tk-on-dark-soft leading-[1.65]">
											{line}
										</p>
									</li>
								))}
							</ul>

							<p className="mt-8 font-body text-[0.9375rem] text-tk-on-dark-soft">
								{en ? "Need one of these? " : "Il vous en faut une ? "}
								<Link
									href="/contact"
									className="font-semibold text-tk-on-dark underline underline-offset-4"
								>
									{en ? "Tell us before signing." : "Dites-le avant de signer."}
								</Link>
							</p>
						</div>
					</div>
				</div>
			</section>

			<Cta dict={dict} />
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const en = locale === "en";

	return {
		title: en
			? "Features — everything TKAMS does"
			: "Fonctionnalités — tout ce que fait TKAMS",
		description: en
			? "The full functional coverage of TKAMS: admissions, curriculum, marks, deliberation, documents, fees, attendance, roles and bulk operations — with the limits stated."
			: "La couverture fonctionnelle complète de TKAMS : admissions, maquettes, notes, délibération, documents, frais, assiduité, rôles et traitements en masse — limites comprises.",
	};
}
