import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/i18n";
import { PageHero } from "@/marketing/PageHero";
import {
	EDITIONS,
	SEC_DOMAINS,
	SEC_NOT_INCLUDED,
} from "@/marketing/secondaire-2026";
import { Cta } from "@/marketing/sections/Cta";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";

/**
 * TKAMS Secondaire — the second edition of the platform.
 *
 * The site sold one platform and one desktop tool while a third product sat
 * finished in `apps/secondary`, invisible: seventeen modules, a PDF report-card
 * engine, state-examination handling, ten test files. A lycée could already
 * request an instance — `institutionType: "secondary"` is accepted by the
 * signup flow — but nothing here told them the product existed.
 *
 * Framed as one family with two editions rather than as a third product,
 * because that is what the code shows: the two share Bun, Hono, tRPC, Drizzle
 * and the tenant model, and diverge completely above it — terms against
 * semesters, coefficients against ECTS credits, class council against a
 * rules-engine deliberation.
 *
 * Two things this page does that a launch page usually does not:
 *
 *   1. It states the product's age. Version 0.0.1, and the peripheries are
 *      thin on purpose. A school that discovers there is no parent portal
 *      during a pilot is a lost customer; one that reads it here and signs
 *      anyway is a pilot that works.
 *   2. It carries no price. No secondary barème exists in `pricing-2026.ts`,
 *      so inventing one on a page whose neighbour publishes every franc would
 *      be the one thing this site cannot afford to do.
 */
export default async function SecondairePage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const en = locale === "en";

	const _total = SEC_DOMAINS.reduce((n, d) => n + d.features.length, 0);

	return (
		<main className="tk-dotgrid bg-tk-bg pt-[var(--tk-header-h)]">
			<PageHero
				eyebrow={
					<>
						{en ? "TKAMS · Secondary edition" : "TKAMS · Édition Secondaire"}
						<span className="rounded-full border border-tk-accent-deep/30 bg-tk-accent-soft px-2.5 py-1 font-code font-medium text-[length:var(--tk-text-xs)] text-tk-accent-deep uppercase tracking-[0.12em]">
							{dict.secondary.available}
						</span>
					</>
				}
				image="/images/web/campus-groupe-2-band.webp"
				imageAlt={
					en
						? "Secondary school students on their campus"
						: "Des élèves du secondaire sur leur campus"
				}
				title={
					en
						? "The Cameroonian secondary school, as it actually runs."
						: "Le lycée camerounais, tel qu'il fonctionne vraiment."
				}
				lede={
					en
						? "Terms, sequences, marks out of 20, coefficients by track, class councils, BEPC and Baccalauréat. Not a university system bent into shape — a second edition built on the secondary model from the database up."
						: "Trimestres, séquences, notes sur 20, coefficients par filière, conseils de classe, BEPC et Baccalauréat. Pas un logiciel du supérieur qu'on plie — une seconde édition bâtie sur le modèle du secondaire, depuis la base de données."
				}
			>
				<nav
					aria-label={en ? "Sections" : "Sections"}
					className="mt-8 flex flex-wrap gap-2"
				>
					{SEC_DOMAINS.map((d) => (
						<a
							key={d.key}
							href={`#${d.key}`}
							className="rounded-full border border-tk-border-strong bg-tk-surface px-3.5 py-1.5 font-body font-medium text-[length:var(--tk-text-sm)] text-tk-ink-2 no-underline transition-colors hover:border-tk-primary hover:text-tk-primary-deep"
						>
							{en ? d.en.name : d.fr.name}
						</a>
					))}
				</nav>
			</PageHero>

			<div className="mx-auto max-w-[86rem] px-6 pt-8 lg:px-10">
				<p className="max-w-3xl font-body text-[length:var(--tk-text-lead)] text-tk-ink-2">
					{dict.secondary.intro}
				</p>
			</div>
			{/* Two editions, one family */}
			<section className="bg-tk-bg-deep">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
						<div className="lg:col-span-4">
							<h2 className="max-w-[16ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.5vw,2.1rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
								{en
									? "One family, two editions."
									: "Une famille, deux éditions."}
							</h2>
							<p className="mt-4 max-w-[38ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.7]">
								{en
									? "The two share their foundations and nothing above them. A secondary school does not compute credits, and a university does not hold class councils — so they are two products, not one with a switch."
									: "Les deux partagent leurs fondations et rien au-dessus. Un lycée ne calcule pas de crédits, une université ne tient pas de conseils de classe — ce sont donc deux produits, pas un seul avec une option."}
							</p>
						</div>

						<div className="min-w-0 lg:col-span-8">
							<div className="overflow-x-auto">
								<table className="w-full min-w-[36rem] border-collapse text-left">
									<thead>
										<tr className="border-tk-border-strong border-b">
											<th className="py-3 pr-4 font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.14em]">
												{en ? "Criterion" : "Critère"}
											</th>
											<th className="py-3 pr-4 font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.14em]">
												{en ? "Secondary" : "Secondaire"}
											</th>
											<th className="py-3 font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.14em]">
												{en ? "Higher education" : "Supérieur"}
											</th>
										</tr>
									</thead>
									<tbody>
										{EDITIONS.map((row) => {
											const c = en ? row.en : row.fr;
											return (
												<tr
													key={c.criterion}
													className="border-tk-border border-b"
												>
													<td className="py-3.5 pr-4 align-top font-body font-medium text-[length:var(--tk-text-body)] text-tk-ink">
														{c.criterion}
													</td>
													<td className="py-3.5 pr-4 align-top font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.6]">
														{c.sec}
													</td>
													<td className="py-3.5 align-top font-body text-[length:var(--tk-text-body)] text-tk-muted leading-[1.6]">
														{c.sup}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>

							<p className="mt-6 font-body text-[length:var(--tk-text-body)] text-tk-ink-2">
								{en
									? "Running a university or an IPES? "
									: "Vous dirigez une université ou un IPES ? "}
								<Link
									href="/produit"
									className="font-semibold text-tk-primary-deep underline underline-offset-4"
								>
									{en
										? "See the higher-education edition"
										: "Voir l'édition Supérieur"}
								</Link>
								.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* One chapter per domain */}
			{SEC_DOMAINS.map((domain, i) => {
				const copy = en ? domain.en : domain.fr;
				const shaded = i % 2 === 1;

				return (
					<section
						key={domain.key}
						id={domain.key}
						className={`scroll-mt-[calc(var(--tk-header-h)+1rem)] border-tk-border border-b ${
							shaded ? "bg-tk-bg-deep" : "bg-tk-bg"
						}`}
					>
						<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
							<div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
								<div className="lg:col-span-4">
									<div className="lg:sticky lg:top-28">
										<span className="font-code text-[length:var(--tk-text-xs)] text-tk-muted tabular-nums">
											{String(i + 1).padStart(2, "0")}
										</span>
										<h2 className="mt-3 max-w-[16ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.5vw,2.1rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
											{copy.name}
										</h2>
										<p className="mt-4 max-w-[38ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.7]">
											{copy.lede}
										</p>
									</div>
								</div>

								<div className="min-w-0 lg:col-span-8">
									<ul className="m-0 list-none p-0">
										{domain.features.map((f) => (
											<li
												key={en ? f.en : f.fr}
												className="flex items-start gap-3.5 border-tk-border border-t py-4 last:border-b"
											>
												<span
													aria-hidden="true"
													className="mt-[0.55rem] h-1.5 w-1.5 flex-none rounded-full bg-tk-primary"
												/>
												<div className="min-w-0">
													<p className="font-body text-[length:var(--tk-text-body)] text-tk-ink leading-[1.6]">
														{en ? f.en : f.fr}
													</p>
													{f.note && (
														<p className="mt-1.5 max-w-[62ch] font-body text-[length:var(--tk-text-sm)] text-tk-muted leading-[1.6]">
															{en ? f.note.en : f.note.fr}
														</p>
													)}
												</div>
											</li>
										))}
									</ul>
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
				<div className="tk-section relative mx-auto max-w-[86rem] px-6 lg:px-10">
					<div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<p className="font-code text-[length:var(--tk-text-xs)] text-tk-on-dark-muted uppercase tracking-[0.16em]">
								{en ? "Read this before signing" : "À lire avant de signer"}
							</p>
							<h2 className="tk-headline mt-4 max-w-[18ch]">
								{en
									? "What this edition does not do yet."
									: "Ce que cette édition ne fait pas encore."}
							</h2>
							<p className="mt-4 max-w-[42ch] font-body text-[length:var(--tk-text-body)] text-tk-on-dark-soft leading-[1.7]">
								{en
									? "The Secondary edition is younger than the platform it belongs to. Its core — setup, marks, report cards, councils, state exams — is complete and tested. Its peripheries are deliberately thin, and here they are."
									: "L'édition Secondaire est plus jeune que la plateforme dont elle fait partie. Son cœur — mise en route, notes, bulletins, conseils, examens d'État — est complet et testé. Ses périphéries sont volontairement minces, et les voici."}
							</p>
						</div>

						<div className="lg:col-span-7">
							<ul className="m-0 list-none p-0">
								{(en ? SEC_NOT_INCLUDED.en : SEC_NOT_INCLUDED.fr).map(
									(line) => (
										<li
											key={line}
											className="flex items-start gap-3.5 border-tk-on-dark-muted/20 border-t py-4 last:border-b"
										>
											<span
												aria-hidden="true"
												className="mt-[0.5rem] h-px w-3.5 flex-none bg-tk-on-dark-muted"
											/>
											<p className="max-w-[58ch] font-body text-[length:var(--tk-text-body)] text-tk-on-dark-soft leading-[1.65]">
												{line}
											</p>
										</li>
									),
								)}
							</ul>

							<p className="mt-8 max-w-[58ch] font-body text-[length:var(--tk-text-body)] text-tk-on-dark-soft">
								{en
									? "Several of these are on the roadmap. If one of them decides your choice, say so when you write — a pilot school's needs steer what gets built next."
									: "Plusieurs sont à la feuille de route. Si l'une d'elles conditionne votre décision, dites-le en nous écrivant — les besoins d'un établissement pilote orientent ce qui sera construit ensuite."}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing — stated as not yet published */}
			<section className="bg-tk-bg">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<h2 className="max-w-[18ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.5vw,2.1rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
								{en ? "The price, honestly." : "Le prix, franchement."}
							</h2>
						</div>
						<div className="lg:col-span-7">
							<p className="max-w-[60ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-[1.75]">
								{en
									? "There is no published scale for the Secondary edition yet. The higher-education edition publishes every franc on its pricing page, and we are not going to invent a secondary scale to fill the gap — you would be the one paying for the guess."
									: "Il n'existe pas encore de barème publié pour l'édition Secondaire. L'édition Supérieur publie chaque franc sur sa page tarifs, et nous n'allons pas inventer un barème secondaire pour combler le vide — c'est vous qui paieriez l'approximation."}
							</p>
							<p className="mt-4 max-w-[60ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-[1.75]">
								{en
									? "Tell us your enrolment and your tracks: you get a named quote, and the same written commitment that binds every other proposal — no amount that is not in the quote can be invoiced without a signed amendment."
									: "Communiquez votre effectif et vos filières : vous recevez un devis nominatif, et le même engagement écrit que toute autre proposition — aucun montant absent du devis ne pourra être facturé sans avenant signé."}
							</p>
							<div className="mt-8 flex flex-wrap gap-3">
								<Link href="/contact" className="tk-btn-primary">
									{en ? "Request a quote" : "Demander un devis"}
								</Link>
								<Link href="/engagements" className="tk-btn-outline">
									{en ? "Read the commitments" : "Lire les engagements"}
								</Link>
							</div>
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
			? "TKAMS Secondary — school management for lycées and collèges"
			: "TKAMS Secondaire — gestion scolaire pour lycées et collèges",
		description: en
			? "Terms, sequences, marks out of 20, coefficients by track, PDF report cards, class councils, BEPC and Baccalauréat. The secondary edition of the TKAMS platform."
			: "Trimestres, séquences, notes sur 20, coefficients par filière, bulletins PDF, conseils de classe, BEPC et Baccalauréat. L'édition Secondaire de la plateforme TKAMS.",
		// Mirrors this page's own title and description. Without it every
		// page inherited the site-wide default, so sharing /tarifs showed
		// the home page's text and image.
		openGraph: mergeOpenGraph({
			title: en
				? "TKAMS Secondary — school management for lycées and collèges"
				: "TKAMS Secondaire — gestion scolaire pour lycées et collèges",
			description: en
				? "Terms, sequences, marks out of 20, coefficients by track, PDF report cards, class councils, BEPC and Baccalauréat. The secondary edition of the TKAMS platform."
				: "Trimestres, séquences, notes sur 20, coefficients par filière, bulletins PDF, conseils de classe, BEPC et Baccalauréat. L'édition Secondaire de la plateforme TKAMS.",
		}),
	};
}
