import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/i18n";
import { DeliberationDemo } from "@/marketing/app-demo/DeliberationDemo";
import { GradeEntryDemo } from "@/marketing/app-demo/GradeEntryDemo";
import { BENEFITS, DEPLOYMENT_MODES, DOMAINS } from "@/marketing/domains-2026";
import { PageHero } from "@/marketing/PageHero";
import { Cta } from "@/marketing/sections/Cta";
import { PhotoBand } from "@/marketing/sections/PhotoBand";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";

/**
 * TKAMS product page.
 *
 * Rebuilt on the commercial proposal's own inventory (p. 06): nine functional
 * domains, one database, no re-keying between modules. The previous page ran on
 * the old editorial scaffolding and the legacy demo components, and made no
 * mention of the domains, the deployment modes or who actually benefits.
 *
 * The two live demos are the same ones the homepage carries — deliberation and
 * grade entry — because they are the only honest way to show a rules engine.
 */
export default async function ProduitPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const en = locale === "en";

	return (
		<main className="tk-dotgrid bg-tk-bg pt-[var(--tk-header-h)]">
			<PageHero
				eyebrow={en ? "TKAMS · the platform" : "TKAMS · la plateforme"}
				image="/images/web/campus-groupe-band.webp"
				imageAlt={
					en
						? "Students together on a university campus"
						: "Des étudiants réunis sur le campus d'une université"
				}
				title={
					en
						? "The whole academic year, from application to diploma."
						: "Toute l'année académique, de la candidature au diplôme."
				}
				lede={
					en
						? "Nine functional domains, one database, no re-keying between modules. French and English interface, natively."
						: "Neuf domaines fonctionnels, une seule base de données, aucune ressaisie entre les modules. Interface FR/EN nativement."
				}
			>
				<div className="flex flex-wrap items-center gap-2.5">
					{DEPLOYMENT_MODES.map((m) => (
						<span
							key={m.en}
							className="rounded-full border border-tk-border-strong bg-tk-surface px-3.5 py-1.5 font-body font-medium text-[length:var(--tk-text-sm)] text-tk-ink-2"
						>
							{en ? m.en : m.fr}
						</span>
					))}
				</div>
			</PageHero>
			{/* Nine domains */}
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<h2 className="tk-headline tk-gradient-text max-w-[24ch]">
					{en ? "Nine functional domains" : "Neuf domaines fonctionnels"}
				</h2>

				<div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{DOMAINS.map((d) => {
						const copy = en ? d.en : d.fr;
						return (
							<div
								key={d.key}
								className={`relative overflow-hidden rounded-xl p-6 ${
									d.featured
										? "bg-tk-primary text-tk-on-primary"
										: "border border-tk-border bg-tk-surface"
								}`}
							>
								{d.featured ? (
									<div
										aria-hidden="true"
										className="tk-field-weave--on-dark pointer-events-none absolute inset-0"
									/>
								) : null}
								<div className="relative">
									<h3
										className={`font-bold font-display text-[length:var(--tk-text-lead)] tracking-[-0.02em] ${
											d.featured ? "" : "text-tk-ink"
										}`}
									>
										{copy.name}
									</h3>
									<p
										className={`mt-2.5 font-body text-[length:var(--tk-text-body)] leading-relaxed ${
											d.featured ? "text-tk-on-primary/85" : "text-tk-ink-2"
										}`}
									>
										{copy.desc}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</section>
			{/*
			 * A breath between the nine domains and the live demos. The page runs
			 * long and entirely on type and interface up to this point.
			 */}
			<PhotoBand
				src="/images/web/etudiant-lecture-band.webp"
				alt={
					en
						? "A student reading on the university lawn"
						: "Un étudiant lisant sur la pelouse de l'université"
				}
				caption={
					en
						? "Nine domains, one database. Nothing is entered twice."
						: "Neuf domaines, une seule base. Rien n'est saisi deux fois."
				}
			/>
			{/* Live demos */}{" "}
			<section className="relative overflow-hidden border-tk-border border-y bg-tk-bg-deep">
				<div
					aria-hidden="true"
					className="tk-field-weave pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_top,#000,transparent_70%)]"
				/>
				<div className="relative mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="max-w-[48rem]">
						<p className="font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.16em]">
							{en ? "Live demonstration" : "Démonstration en direct"}
						</p>
						<h2 className="tk-headline tk-gradient-text mt-4">
							{en
								? "Move the jury's rules. Watch the cohort follow."
								: "Déplacez les règles du jury. La cohorte suit."}
						</h2>
						<p className="mt-4 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
							{en
								? "The real interface, with demonstration data. Change a threshold and every file is re-decided instantly."
								: "L'interface réelle, avec des données de démonstration. Changez un seuil et chaque dossier est réévalué instantanément."}
						</p>
					</div>

					<div className="mt-9">
						<DeliberationDemo
							locale={locale}
							caption={
								en
									? "Deliberation · move the threshold, the eliminating mark or compensation."
									: "Délibération · déplacez le seuil, la note éliminatoire ou la compensation."
							}
						/>
					</div>

					<div className="mt-12">
						<GradeEntryDemo
							locale={locale}
							caption={
								en
									? "Grade entry · change a mark, the weighted average and the status recompute."
									: "Saisie des notes · modifiez une note, la moyenne pondérée et le statut se recalculent."
							}
						/>
					</div>
				</div>
			</section>
			{/* Who benefits */}
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<h2 className="tk-headline tk-gradient-text max-w-[24ch]">
					{en ? "Who gains what" : "Qui gagne quoi"}
				</h2>

				<div className="mt-9 grid gap-5 lg:grid-cols-3">
					{[
						BENEFITS.institution,
						BENEFITS.students,
						BENEFITS.administration,
					].map((group) => {
						const copy = en ? group.en : group.fr;
						return (
							<div
								key={copy.title}
								className="rounded-xl border border-tk-border bg-tk-surface p-6"
							>
								<h3 className="font-bold font-display text-[length:var(--tk-text-lead)] text-tk-ink tracking-[-0.02em]">
									{copy.title}
								</h3>
								<ul className="mt-4 space-y-2.5">
									{copy.items.map((item) => (
										<li key={item} className="flex gap-2.5">
											<span
												aria-hidden="true"
												className="mt-[0.55rem] h-1.5 w-1.5 flex-none rounded-full bg-tk-primary"
											/>
											<span className="font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
												{item}
											</span>
										</li>
									))}
								</ul>
							</div>
						);
					})}
				</div>
			</section>
			{/* Boundary to OnReceipt */}
			<section className="border-tk-border border-y bg-tk-surface">
				<div className="mx-auto max-w-[86rem] px-6 py-12 lg:px-10 lg:py-16">
					<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
						<div>
							<h2 className="max-w-[30ch] font-bold font-display text-[1.25rem] text-tk-ink leading-snug tracking-[-0.02em]">
								{en
									? "Below roughly 350 students, TKAMS costs 1 000 000 FCFA a year whatever your real headcount."
									: "En dessous d'environ 350 étudiants, TKAMS coûte 1 000 000 FCFA par an quel que soit votre effectif réel."}
							</h2>
							<p className="mt-3 max-w-[62ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
								{en
									? "If that is your case and your need is limited to official documents, OnReceipt is the economically rational choice. We would rather sell you the right solution than the more expensive one."
									: "Si vous êtes dans ce cas et que votre besoin se limite aux documents officiels, OnReceipt est le choix économiquement rationnel. Nous préférons vous vendre la bonne solution que la plus chère."}
							</p>
						</div>
						<div className="flex flex-wrap gap-3">
							<Link
								href="/onreceipt"
								className="rounded-md border border-tk-border-strong px-5 py-3 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-ink transition-colors hover:bg-tk-bg-deep"
							>
								{en ? "See OnReceipt" : "Voir OnReceipt"}
							</Link>
							<Link
								href="/comparatif"
								className="rounded-md border border-tk-primary px-5 py-3 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-eyebrow transition-colors hover:bg-tk-primary hover:text-tk-on-primary"
							>
								{en ? "Compare the two" : "Comparer les deux"}
							</Link>
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
			? "TKAMS — LMD academic management platform"
			: "TKAMS — plateforme de gestion académique LMD",
		description: en
			? "Nine functional domains, one database, no re-keying: enrolment, catalogue, fees, attendance, marks, deliberation, documents, security, multi-supervision."
			: "Neuf domaines fonctionnels, une seule base de données, aucune ressaisie : inscriptions, maquettes, frais, assiduité, notes, délibération, documents, sécurité, multi-tutelle.",
		// Mirrors this page's own title and description. Without it every
		// page inherited the site-wide default, so sharing /tarifs showed
		// the home page's text and image.
		openGraph: mergeOpenGraph({
			title: en
				? "TKAMS — LMD academic management platform"
				: "TKAMS — plateforme de gestion académique LMD",
			description: en
				? "Nine functional domains, one database, no re-keying: enrolment, catalogue, fees, attendance, marks, deliberation, documents, security, multi-supervision."
				: "Neuf domaines fonctionnels, une seule base de données, aucune ressaisie : inscriptions, maquettes, frais, assiduité, notes, délibération, documents, sécurité, multi-tutelle.",
		}),
	};
}
