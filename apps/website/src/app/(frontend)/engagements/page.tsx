import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n";
import { GUARANTEES, TIMELINE } from "@/marketing/pricing-2026";

/**
 * Commitments — guarantees, timeline, payment terms and general conditions.
 *
 * Transcribed from the commercial proposal (pp. 17–18), which the site had
 * never published. An institution comparing vendors asks four questions before
 * signing — what do you guarantee, how long does it take, how do I pay, and
 * what happens if I leave — and a site that answers none of them sends the
 * buyer back to the sales cycle for facts that are already written down.
 *
 * The twelve clauses are reproduced in plain French, as they are in the
 * proposal. They are not a substitute for the signed document: the page says
 * so, and points to the PDF.
 */
export default async function Page() {
	const locale = await getLocale();
	const en = locale === "en";

	const guarantees = en
		? [
				{
					name: "Compliance",
					detail:
						"Documents compliant with state university standards. A rejection on formal grounds attributable to the software is corrected free of charge.",
				},
				{
					name: "Money back",
					detail:
						"30 days on OnReceipt licences, full refund, no justification required.",
				},
				{
					name: "Updates",
					detail:
						"Continuous on TKAMS; included for 3, 5 or 7 years on perpetual licences, depending on the plan.",
				},
				{
					name: "Data security",
					detail:
						"TLS, role-based access control, audit trail, hashed API keys. AES-128 encrypted QR on OnReceipt.",
				},
				{
					name: "Support times",
					detail:
						"Standard: 2 working days. Priority: 4 working hours. Urgent: Établissement and TKAMS Pro. Mon–Fri, 8am–5pm, Douala.",
				},
				{
					name: "Reversibility",
					detail:
						"Full export at any time. After a TKAMS contract ends: read and export kept open for 90 days.",
				},
			]
		: [...GUARANTEES];

	const payment = en
		? {
				means: [
					"Bank transfer",
					"Mobile Money (MTN, Orange)",
					"Company cheque",
					"Cash, under 100 000 FCFA",
				],
				rhythm: [
					["OnReceipt", "50 % on order, balance after training"],
					["Perpetual licences", "3 instalments over 3 months, no surcharge"],
					["TKAMS", "60 % at start-up, 40 % on acceptance, or per semester"],
					["On-premise", "payable on go-live"],
				],
			}
		: {
				means: [
					"Virement bancaire",
					"Mobile Money (MTN, Orange)",
					"Chèque d'entreprise",
					"Espèces, sous 100 000 FCFA",
				],
				rhythm: [
					["OnReceipt", "50 % à la commande, solde après formation"],
					["Perpétuelles", "3 tranches sur 3 mois, sans majoration"],
					["TKAMS", "60 % au démarrage, 40 % à la recette, ou semestriel"],
					["On-premise", "payable à la mise en production"],
				],
			};

	const clauses = en
		? [
				[
					"Purpose",
					"This page describes the TKAMS and QR Code OnReceipt offers and the terms of their sale. It constitutes a proposal; the signed quote and the order form form the contract.",
				],
				[
					"Term",
					"TKAMS: 12 months, tacit renewal, terminable in writing with 60 days' notice. OnReceipt annual: 12 months without automatic renewal. OnReceipt perpetual: a right of use without time limit, with updates and support included for the subscribed term (3, 5 or 7 years), extendable; at term the software remains fully usable in its last covered version.",
				],
				[
					"Billing basis",
					"The TKAMS headcount is the one declared at the opening of the academic year. A variation of 10 % or less during the year is not re-invoiced. Beyond that, a supplement applies pro rata to the remaining months, on documentary evidence.",
				],
				[
					"Price",
					"FCFA excluding tax, firm for the duration of the current commitment. Any change is notified at least 90 days before the renewal date; you remain free not to renew.",
				],
				[
					"Data ownership",
					"Academic and personal data remain the exclusive property of the institution. The publisher acts as a technical subcontractor, makes no commercial use of it and transfers it to no third party.",
				],
				[
					"Software ownership",
					"Licences confer a right of use, not a transfer of intellectual property. The source code is not assigned, save under an explicit Enterprise agreement. Resale or provision to a third party is prohibited.",
				],
				[
					"Number of seats",
					"OnReceipt licences are named and limited to the number of seats indicated. An additional seat is charged at the published rate.",
				],
				[
					"Migration",
					"Any historical migration is subject to a firm quote after examining a sample, according to the published scale. No work is started before your written agreement.",
				],
				[
					"Reversibility and end of contract",
					"Full export of data in an exploitable format, at any time. After TKAMS termination: read and export kept open for 90 days, then deletion on attestation. A perpetual OnReceipt licence remains usable indefinitely.",
				],
				[
					"Institution obligations",
					"Appoint a project referent, provide exploitable data, respect the confidentiality of access credentials, declare headcount in good faith.",
				],
				[
					"Liability and confidentiality",
					"The publisher is liable for the functioning of the software and the formal compliance of documents, not for the accuracy of the marks entered nor for the pedagogical decisions taken on that basis. Reciprocal confidentiality, during the relationship and for two years after its term.",
				],
				[
					"Applicable law",
					"Cameroonian law. An amicable solution is sought within 30 days before any contentious action. Competent jurisdiction: Douala.",
				],
			]
		: [
				[
					"Objet",
					"Cette page décrit les offres TKAMS et QR Code OnReceipt et les conditions de leur vente. Elle vaut proposition ; le devis signé et le bon de commande valent contrat.",
				],
				[
					"Durée",
					"TKAMS : 12 mois, tacite reconduction, résiliable par écrit avec échéance de 60 jours. OnReceipt annuel : 12 mois sans reconduction automatique. OnReceipt perpétuelle : droit d'usage sans limite de durée, MAJ et support inclus pour la durée souscrite (3, 5 ou 7 ans), prolongeables ; au terme, le logiciel reste pleinement utilisable dans sa dernière version couverte.",
				],
				[
					"Base de facturation",
					"L'effectif TKAMS est celui déclaré à l'ouverture de l'année académique. Une variation ≤ 10 % en cours d'année n'est pas refacturée. Au-delà, complément au prorata des mois restants, sur justificatif.",
				],
				[
					"Prix",
					"FCFA hors taxes, fermes pendant l'engagement en cours. Toute évolution est notifiée au moins 90 jours avant l'échéance de renouvellement ; vous restez libre de ne pas renouveler.",
				],
				[
					"Propriété des données",
					"Les données académiques et personnelles restent la propriété exclusive de l'établissement. L'éditeur agit comme sous-traitant technique, n'en fait aucun usage commercial et ne les cède à aucun tiers.",
				],
				[
					"Propriété du logiciel",
					"Les licences confèrent un droit d'usage, non un transfert de propriété intellectuelle. Le code source n'est pas cédé, sauf accord Enterprise explicite. Revente ou mise à disposition à un tiers interdites.",
				],
				[
					"Nombre de postes",
					"Les licences OnReceipt sont nominatives et limitées au nombre de postes indiqué. Poste supplémentaire au tarif publié.",
				],
				[
					"Migration",
					"Toute reprise d'historique fait l'objet d'un devis ferme après examen d'un échantillon, selon le barème publié. Aucun travail engagé avant votre accord écrit.",
				],
				[
					"Réversibilité et fin de contrat",
					"Export complet des données dans un format exploitable, à tout moment. Après résiliation TKAMS : lecture et export maintenus 90 jours, puis suppression sur attestation. Une perpétuelle OnReceipt reste utilisable indéfiniment.",
				],
				[
					"Obligations de l'établissement",
					"Désigner un référent projet, fournir des données exploitables, respecter la confidentialité des accès, déclarer son effectif de bonne foi.",
				],
				[
					"Responsabilité et confidentialité",
					"L'éditeur répond du fonctionnement du logiciel et de la conformité de forme des documents, non de l'exactitude des notes saisies ni des décisions pédagogiques prises sur cette base. Confidentialité réciproque, pendant la relation et deux ans après son terme.",
				],
				[
					"Droit applicable",
					"Droit camerounais. Recherche d'une solution amiable sous 30 jours avant toute action contentieuse. Juridiction compétente : Douala.",
				],
			];

	const faq = en
		? [
				[
					"“And if we stop?”",
					"You export everything, at any time. After TKAMS termination, reading stays open for 90 days. A perpetual OnReceipt licence keeps working.",
				],
				[
					"“And if our headcount falls?”",
					"Billing follows the headcount declared at the opening. At renewal it is recalculated on the real figure — downwards as well as upwards.",
				],
				[
					"“And if the price rises?”",
					"Any change is notified 90 days before the term. You remain free not to renew, with no penalty and no exit fee.",
				],
			]
		: [
				[
					"« Et si nous arrêtons ? »",
					"Vous exportez tout, à tout moment. Après résiliation TKAMS, la lecture reste ouverte 90 jours. Une perpétuelle OnReceipt continue de fonctionner.",
				],
				[
					"« Et si nos effectifs chutent ? »",
					"La facturation suit l'effectif déclaré à l'ouverture. À la reconduction, elle est recalculée sur l'effectif réel — à la baisse comme à la hausse.",
				],
				[
					"« Et si le prix augmente ? »",
					"Toute évolution vous est notifiée 90 jours avant l'échéance. Vous restez libre de ne pas renouveler, sans pénalité ni frais de sortie.",
				],
			];

	return (
		<main className="bg-tk-bg pt-[68px]">
			{/* Masthead */}
			<section className="border-tk-border border-b">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<p className="font-code text-[0.7rem] text-tk-eyebrow uppercase tracking-[0.16em]">
						{en ? "Commitments" : "Engagements"}
					</p>
					<h1 className="mt-4 max-w-[22ch] font-display font-extrabold text-[clamp(2rem,1.3rem+2.6vw,3.25rem)] text-tk-title leading-[1.04] tracking-[-0.035em]">
						{en
							? "What we guarantee, and how long it takes."
							: "Ce que nous garantissons, et en combien de temps."}
					</h1>
					<p className="mt-5 max-w-[58ch] font-body text-[1.05rem] text-tk-ink-2 leading-relaxed">
						{en
							? "Six weeks at most, forty-eight hours at least. Every guarantee below is written into the quote, not promised verbally."
							: "Six semaines au maximum, quarante-huit heures au minimum. Chaque garantie ci-dessous est écrite dans le devis, pas promise à l'oral."}
					</p>
				</div>
			</section>

			{/* Guarantees */}
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<h2 className="font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
					{en ? "Six guarantees" : "Six garanties"}
				</h2>
				<dl className="mt-9 grid gap-px overflow-hidden rounded-xl border border-tk-border bg-tk-border sm:grid-cols-2 lg:grid-cols-3">
					{guarantees.map((g) => (
						<div key={g.name} className="bg-tk-surface p-6">
							<dt className="font-body font-semibold text-[0.95rem] text-tk-ink">
								{g.name}
							</dt>
							<dd className="mt-2 font-body text-[0.875rem] text-tk-ink-2 leading-relaxed">
								{g.detail}
							</dd>
						</div>
					))}
				</dl>
			</section>

			{/* Timeline */}
			<section className="border-tk-border border-y bg-tk-bg-deep">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<h2 className="max-w-[26ch] font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
						{en
							? "Six weeks at most, forty-eight hours at least"
							: "Six semaines au maximum, quarante-huit heures au minimum"}
					</h2>
					<p className="mt-4 max-w-[56ch] font-body text-[0.95rem] text-tk-ink-2 leading-relaxed">
						{en
							? "The schedule we normally keep, contractualised in the quote with the validation milestones that belong to you."
							: "Le calendrier que nous tenons habituellement, contractualisé dans le devis avec les jalons de validation qui vous appartiennent."}
					</p>

					<div className="mt-9 overflow-x-auto rounded-xl border border-tk-border bg-tk-surface">
						<table className="w-full border-collapse">
							<thead>
								<tr className="bg-tk-dark">
									<th className="px-4 py-3.5 text-left font-body font-semibold text-[0.78rem] text-tk-on-dark sm:px-5">
										{en ? "Stage" : "Étape"}
									</th>
									<th className="px-4 py-3.5 text-left font-body font-semibold text-[0.78rem] text-tk-on-dark sm:px-5">
										QR Code OnReceipt
									</th>
									<th className="px-4 py-3.5 text-left font-body font-semibold text-[0.78rem] text-tk-on-dark sm:px-5">
										TKAMS
									</th>
								</tr>
							</thead>
							<tbody>
								{TIMELINE.map((row) => (
									<tr
										key={row.step}
										className="border-tk-border border-b last:border-0"
									>
										<th
											scope="row"
											className="whitespace-nowrap px-4 py-3.5 text-left align-top font-body font-semibold text-[0.85rem] text-tk-ink sm:px-5"
										>
											{row.step}
										</th>
										<td className="px-4 py-3.5 align-top font-body text-[0.85rem] text-tk-ink-2 leading-relaxed sm:px-5">
											{row.onreceipt}
										</td>
										<td className="px-4 py-3.5 align-top font-body text-[0.85rem] text-tk-ink-2 leading-relaxed sm:px-5">
											{row.tkams}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="mt-6 grid gap-4 sm:grid-cols-3">
						{(en
							? [
									[
										"What we expect of you",
										"A reachable referent, exploitable data, milestones validated within five working days.",
									],
									[
										"What we commit to",
										"The milestones set out in the quote, training before production, no billing for an undelivered stage.",
									],
									[
										"The right moment",
										"Between two exam sessions, ideally six weeks before the year opens.",
									],
								]
							: [
									[
										"Ce que nous attendons de vous",
										"Un référent joignable, des données exploitables, la validation des jalons sous cinq jours ouvrés.",
									],
									[
										"Ce que nous engageons",
										"Les jalons repris dans le devis, la formation avant production, aucune facturation d'une étape non livrée.",
									],
									[
										"Le bon moment",
										"Entre deux sessions d'examens, idéalement six semaines avant l'ouverture de l'année.",
									],
								]
						).map(([t, d]) => (
							<div
								key={t}
								className="rounded-xl border border-tk-border bg-tk-surface p-5"
							>
								<p className="font-body font-semibold text-[0.875rem] text-tk-ink">
									{t}
								</p>
								<p className="mt-2 font-body text-[0.84rem] text-tk-ink-2 leading-relaxed">
									{d}
								</p>
							</div>
						))}
					</div>

					<p className="mt-5 max-w-[72ch] font-body text-[0.85rem] text-tk-muted leading-relaxed">
						{en
							? "An OnReceipt deployment can be compressed to 48 hours when a deadline is imminent. A TKAMS deployment cannot be, without risk: we would rather say so than promise it."
							: "Un déploiement OnReceipt peut être compressé à 48 heures en cas d'échéance imminente. Un déploiement TKAMS ne peut pas l'être sans risque : nous préférons le dire que de vous le promettre."}
					</p>
				</div>
			</section>

			{/* Payment */}
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<h2 className="font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
					{en ? "How you pay" : "Comment on paie"}
				</h2>

				<div className="mt-9 grid gap-5 lg:grid-cols-2">
					<div className="rounded-xl border border-tk-border bg-tk-surface p-6">
						<h3 className="font-body font-semibold text-[0.9rem] text-tk-ink">
							{en ? "Accepted means" : "Moyens acceptés"}
						</h3>
						<ul className="mt-4 space-y-2.5">
							{payment.means.map((m) => (
								<li key={m} className="flex gap-2.5">
									<span
										aria-hidden="true"
										className="mt-[0.55rem] h-1.5 w-1.5 flex-none rounded-full bg-tk-primary"
									/>
									<span className="font-body text-[0.9rem] text-tk-ink-2">
										{m}
									</span>
								</li>
							))}
						</ul>
					</div>

					<div className="rounded-xl border border-tk-border bg-tk-surface p-6">
						<h3 className="font-body font-semibold text-[0.9rem] text-tk-ink">
							{en
								? "Proposed rhythm — negotiable"
								: "Rythme proposé — négociable"}
						</h3>
						<dl className="mt-4 divide-y divide-tk-border">
							{payment.rhythm.map(([k, v]) => (
								<div key={k} className="py-2.5 first:pt-0 last:pb-0">
									<dt className="font-body font-semibold text-[0.85rem] text-tk-ink">
										{k}
									</dt>
									<dd className="mt-0.5 font-body text-[0.85rem] text-tk-ink-2">
										{v}
									</dd>
								</div>
							))}
						</dl>
					</div>
				</div>

				<div className="mt-5 rounded-xl border border-tk-primary/35 bg-tk-primary-soft p-6">
					<p className="font-body font-semibold text-[0.9rem] text-tk-eyebrow">
						{en
							? "Pricing is negotiable, and we write it down"
							: "Tarification négociable, et nous l'écrivons"}
					</p>
					<p className="mt-2.5 max-w-[74ch] font-body text-[0.9rem] text-tk-ink-2 leading-relaxed">
						{en
							? "An adapted quote, a longer payment schedule, a multi-year institutional discount, a public preferential rate, a hybrid formula: everything is open before signature. No discount reduces the scope without that being written into the quote."
							: "Devis adapté, échelonnement plus long, remise institutionnelle pluriannuelle, tarif préférentiel public, formule hybride : tout est ouvert avant signature. Aucune remise ne réduit le périmètre sans que ce soit écrit dans le devis."}
					</p>
				</div>
			</section>

			{/* Clauses */}
			<section className="border-tk-border border-y bg-tk-bg-deep">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<h2 className="max-w-[26ch] font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
						{en
							? "Twelve clauses, in plain language"
							: "Douze clauses, en français clair"}
					</h2>

					<ol className="mt-9 grid gap-x-10 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
						{clauses.map(([title, body], i) => (
							<li key={title} className="border-tk-border border-t pt-4">
								<h3 className="font-body font-semibold text-[0.9rem] text-tk-ink">
									<span className="text-tk-eyebrow tabular-nums">{i + 1}.</span>{" "}
									{title}
								</h3>
								<p className="mt-2 font-body text-[0.85rem] text-tk-ink-2 leading-relaxed">
									{body}
								</p>
							</li>
						))}
					</ol>

					<p className="mt-8 max-w-[74rem] rounded-xl border border-tk-border bg-tk-surface p-5 font-body text-[0.875rem] text-tk-ink-2 leading-relaxed">
						{en
							? "This page reproduces the conditions of the 2026 commercial proposal for information. The signed quote and order form prevail. "
							: "Cette page reproduit à titre d'information les conditions de la proposition commerciale 2026. Le devis signé et le bon de commande font foi. "}
						<Link
							href="/documents/Proposition commerciale TKAMS et QRCode 2026.pdf"
							className="font-semibold text-tk-eyebrow underline-offset-4 hover:underline"
						>
							{en
								? "Download the full document (PDF, 19 pages)"
								: "Télécharger le document complet (PDF, 19 pages)"}
						</Link>
					</p>
				</div>
			</section>

			{/* The three questions */}
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<h2 className="max-w-[30ch] font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
					{en
						? "The three questions we are always asked at this point"
						: "Les trois questions qu'on nous pose toujours à ce stade"}
				</h2>
				<div className="mt-9 grid gap-5 lg:grid-cols-3">
					{faq.map(([q, a]) => (
						<div
							key={q}
							className="rounded-xl border border-tk-border bg-tk-surface p-6"
						>
							<h3 className="font-bold font-display text-[1rem] text-tk-ink tracking-[-0.02em]">
								{q}
							</h3>
							<p className="mt-3 font-body text-[0.875rem] text-tk-ink-2 leading-relaxed">
								{a}
							</p>
						</div>
					))}
				</div>

				<div className="mt-10 flex flex-wrap gap-3">
					<Link
						href="/contact"
						className="rounded-md bg-tk-primary px-6 py-3.5 font-body font-semibold text-[0.9375rem] text-tk-on-primary transition-colors hover:bg-tk-primary-deep"
					>
						{en ? "Request a demo" : "Demander une démo"}
					</Link>
					<Link
						href="/tarifs"
						className="rounded-md border border-tk-border-strong px-6 py-3.5 font-body font-semibold text-[0.9375rem] text-tk-ink transition-colors hover:bg-tk-bg-deep"
					>
						{en ? "See all prices" : "Voir tous les tarifs"}
					</Link>
				</div>
			</section>
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const en = locale === "en";
	return {
		title: en ? "Commitments — TKAMS" : "Engagements — TKAMS",
		description: en
			? "Guarantees, deployment timeline, payment terms and the twelve general conditions — written down, before signature."
			: "Garanties, planning de déploiement, modalités de paiement et douze conditions générales — écrites, avant signature.",
	};
}
