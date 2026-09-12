import Image from "next/image";
import type { Locale } from "@/i18n";
import { IsoField } from "../Isometric";
import { Reveal } from "../Reveal";

/**
 * « Le calcul que personne ne fait » — the proposal's opening argument (p. 03),
 * which the old site never made.
 *
 * The move is to price the status quo before pricing the product: 800 documents
 * a year at 30 minutes each is 400 hours, two and a half months of an agent's
 * time, and it never appears on an invoice. That reframes the licence fee from
 * a new cost into a substitution.
 *
 * The disclaimer at the end is kept verbatim in spirit because it is what makes
 * the rest credible: no software removes staff, it moves their hours.
 */
export function TheCost({ locale }: { locale: Locale }) {
	const en = locale === "en";

	const rows = en
		? [
				["800 documents × 30 min", "400 hours"],
				["In 7-hour days", "57 days"],
				["In one agent's full time", "2.5 months"],
			]
		: [
				["800 documents × 30 min", "400 heures"],
				["En journées de 7 heures", "57 jours"],
				["En temps plein d'un agent", "2,5 mois"],
			];

	const pains = en
		? [
				{
					t: "Non-compliance",
					d: "Documents rejected by the supervising body, full re-runs, students stuck mid-process.",
				},
				{
					t: "Manual process",
					d: "Up to 30 minutes per document produced by hand. Three weeks for a single deliberation.",
				},
				{
					t: "Calculation errors",
					d: "Averages, credits and compensations recomputed on a spreadsheet: every entry is a dispute waiting to happen.",
				},
				{
					t: "Forgery",
					d: "Without a verification device, a transcript is easy to reproduce. The diploma's credibility is at stake.",
				},
				{
					t: "No audit trail",
					d: "Impossible to say who produced which document, on what date, from which validated marks.",
				},
			]
		: [
				{
					t: "Non-conformité",
					d: "Documents rejetés par la tutelle, reprises complètes, étudiants bloqués dans leurs démarches.",
				},
				{
					t: "Processus manuel",
					d: "Jusqu'à 30 minutes par document produit à la main. Trois semaines pour une seule délibération.",
				},
				{
					t: "Erreurs de calcul",
					d: "Moyennes, crédits et compensations recalculés sur tableur : chaque saisie est un risque de contentieux.",
				},
				{
					t: "Falsification",
					d: "Sans dispositif de vérification, un relevé se reproduit facilement. La crédibilité du diplôme est en jeu.",
				},
				{
					t: "Absence de traçabilité",
					d: "Impossible de dire qui a produit quel document, à quelle date, sur quelles notes validées.",
				},
			];

	return (
		<section>
			<div className="tk-section mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
					<div>
						<p className="font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.16em]">
							{en ? "The situation" : "Le constat"}
						</p>
						<h2 className="tk-headline mt-4 max-w-[20ch] text-tk-title">
							{en
								? "What manual management really costs you."
								: "Ce que la gestion manuelle vous coûte vraiment."}
						</h2>
						<p className="mt-4 max-w-[52ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-relaxed">
							{en
								? "Universities, private institutes and affiliated establishments carry an administrative load that is foreign to their teaching mission. Five difficulties come up, institution after institution."
								: "Universités, instituts privés et établissements affiliés à une tutelle portent une charge administrative étrangère à leur mission d'enseignement. Cinq difficultés reviennent, établissement après établissement."}
						</p>

						<ul className="mt-8 divide-y divide-tk-border">
							{pains.map((p) => (
								<li
									key={p.t}
									className="grid gap-1 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6"
								>
									<h3 className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-ink">
										{p.t}
									</h3>
									<p className="font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
										{p.d}
									</p>
								</li>
							))}
						</ul>
					</div>

					<div>
						{/* The calculation nobody does */}
						<div className="rounded-xl border border-tk-border bg-tk-primary-soft p-6 lg:p-7">
							<p className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-primary-deep">
								{en
									? "The calculation nobody does"
									: "Le calcul que personne ne fait"}
							</p>
							<p className="mt-3 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
								{en
									? "An institution of 400 students, two documents per student per year, produced by hand:"
									: "Établissement de 400 étudiants, deux documents par étudiant et par an, à la main :"}
							</p>

							<dl className="mt-5">
								{rows.map(([k, v], i) => (
									<div
										key={k}
										className={`flex items-baseline justify-between gap-4 py-2.5 ${
											i > 0 ? "border-tk-border border-t" : ""
										}`}
									>
										<dt className="font-body text-[length:var(--tk-text-body)] text-tk-ink-2">
											{k}
										</dt>
										<dd className="font-bold font-display text-[length:var(--tk-text-lead)] text-tk-ink tabular-nums">
											{v}
										</dd>
									</div>
								))}
								<div className="mt-2 flex items-baseline justify-between gap-4 border-tk-border-strong border-t pt-3">
									<dt className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-ink">
										{en ? "Plus deliberations" : "Plus les délibérations"}
									</dt>
									<dd className="font-bold font-display text-[length:var(--tk-text-lead)] text-tk-eyebrow">
										{en ? "+ 3 weeks / session" : "+ 3 sem. / session"}
									</dd>
								</div>
							</dl>

							{/*
							 * The 400 hours, drawn.
							 *
							 * The figure sits in the table above as a number, and a number
							 * of that size stops being felt — 400 reads the same as 40 to
							 * a reader skimming. Fifty-seven filled tiles against a hundred
							 * make the working days visible as an area before the caption
							 * is read. One tile is one seven-hour day.
							 */}
							<Reveal className="mt-6">
								<IsoField
									cols={10}
									rows={10}
									filled={57}
									caption={
										en
											? "57 working days out of a 100-day grid — the time a 400-student institution hands to paperwork each year."
											: "57 journées de travail sur une grille de 100 — le temps qu'un établissement de 400 étudiants confie à la paperasse chaque année."
									}
								/>
							</Reveal>

							<p className="mt-5 font-body text-[length:var(--tk-text-sm)] text-tk-muted leading-relaxed">
								{en
									? "This time appears on no invoice. It is paid every year by your payroll."
									: "Ce temps n'apparaît sur aucune facture. Il est payé chaque année par votre masse salariale."}
							</p>
						</div>

						{/* What we do not claim */}
						<div className="relative mt-5 overflow-hidden rounded-xl">
							{/*
							 * A real classroom rather than a stock photograph of a Western
							 * campus: the institutions this product serves should recognise
							 * themselves on the page.
							 */}
							<Image
								src="/images/web/etudiante-livres.webp"
								alt=""
								aria-hidden="true"
								width={1800}
								height={1200}
								className="aspect-[16/9] w-full object-cover"
							/>
							<div
								aria-hidden="true"
								className="absolute inset-0 bg-gradient-to-t from-tk-dark/92 via-tk-dark/72 to-tk-dark/35"
							/>
							<div className="absolute inset-0 flex flex-col justify-end p-5">
								<p className="font-body font-semibold text-[0.82rem] text-tk-primary-bright">
									{en
										? "What we do not claim"
										: "Ce que nous ne prétendons pas"}
								</p>
								<p className="mt-1.5 font-body text-[length:var(--tk-text-body)] text-tk-on-dark leading-relaxed">
									{en
										? "No software will remove your staff. It moves 400 hours of re-keying towards student support and quality control."
										: "Aucun logiciel ne supprimera votre personnel. Il déplace 400 heures de recopie vers l'accompagnement des étudiants et le contrôle qualité."}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
