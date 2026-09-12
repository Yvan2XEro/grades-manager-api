import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/i18n";
import { Calculateur } from "@/marketing/estimator/Calculateur";
import {
	ADMIN_SEAT,
	ANNUAL_FLOOR,
	annualLicence,
	COST_BREAKDOWN,
	fcfa,
	MIGRATION_BANDS,
	MIGRATION_FLOOR,
	NOT_INCLUDED_DETAIL,
	ONPREM_INSTALL,
	OPTIONS,
	PIONEER_DISCOUNT,
	STUDENT_BANDS,
} from "@/marketing/pricing-2026";
import { Cta } from "@/marketing/sections/Cta";

/**
 * Pricing.
 *
 * Rewritten against the 2026 commercial proposal, which the previous page
 * contradicted on every figure: it quoted 2 000 F per student (now 2 800,
 * degressive), a 750 000 F floor (now 1 000 000) and a 1 500 000 F on-premise
 * fee (now 2 100 000), and it omitted migration, options and exclusions
 * entirely.
 *
 * The structure follows the proposal's own: what is billed, how the rate
 * degrades, what migration costs, what the options are, where each franc goes,
 * and — the page the proposal calls its most important — what is not included.
 */
export default async function TarifsPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const en = locale === "en";

	const lines = en
		? [
				{
					name: "Student account",
					amount: `${fcfa.format(2_800)} FCFA`,
					sub: "degressive, see below",
					pays: "All modules, secure hosting, updates, backups, support and unlimited official exports for that student. That is 233 FCFA per month.",
					freq: "Annual",
				},
				{
					name: "Administrative account",
					amount: `${fcfa.format(ADMIN_SEAT)} FCFA`,
					sub: "",
					pays: "One named access with a role and permissions — registry, management, lead teacher — logged in the audit trail.",
					freq: "Annual",
				},
				{
					name: "Minimum tier",
					amount: `${fcfa.format(ANNUAL_FLOOR)} FCFA`,
					sub: "",
					pays: "Annual billing floor. Below roughly 350 students, this is the amount that applies. We say so before, not after.",
					freq: "Annual",
				},
				{
					name: "On-premise installation",
					amount: `${fcfa.format(ONPREM_INSTALL)} FCFA`,
					sub: "",
					pays: "Only if you host TKAMS on your own servers: deployment, hardening, skills transfer to your IT team. Optional.",
					freq: "One-off",
				},
				{
					name: "Onboarding + current year",
					amount: "0 FCFA",
					sub: "",
					pays: "Instance creation, configuration of programmes and course structures, import of students and of the current year's marks, start-up support.",
					freq: "—",
				},
			]
		: [
				{
					name: "Compte étudiant",
					amount: `${fcfa.format(2_800)} FCFA`,
					sub: "dégressif, voir ci-dessous",
					pays: "Tous les modules, hébergement sécurisé, mises à jour, sauvegardes, support et exports officiels illimités pour cet étudiant. Soit 233 FCFA par mois.",
					freq: "Annuelle",
				},
				{
					name: "Compte administratif",
					amount: `${fcfa.format(ADMIN_SEAT)} FCFA`,
					sub: "",
					pays: "Un accès nominatif avec rôle et droits — scolarité, direction, enseignant responsable — journalisé dans la piste d'audit.",
					freq: "Annuelle",
				},
				{
					name: "Palier minimum",
					amount: `${fcfa.format(ANNUAL_FLOOR)} FCFA`,
					sub: "",
					pays: "Plancher de facturation annuelle. En dessous d'environ 350 étudiants, c'est ce montant qui s'applique. Nous le disons avant, pas après.",
					freq: "Annuelle",
				},
				{
					name: "Installation on-premise",
					amount: `${fcfa.format(ONPREM_INSTALL)} FCFA`,
					sub: "",
					pays: "Seulement si vous hébergez TKAMS sur vos serveurs : déploiement, sécurisation, transfert de compétences à votre équipe IT. Facultatif.",
					freq: "Une fois",
				},
				{
					name: "Onboarding + année en cours",
					amount: "0 FCFA",
					sub: "",
					pays: "Création de l'instance, paramétrage des filières et maquettes, import des étudiants et des notes de l'année en cours, accompagnement au démarrage.",
					freq: "—",
				},
			];

	/** Worked examples straight from the proposal's simulation table (p. 14). */
	const simulations = [200, 400, 800, 1_500].map((n) => annualLicence(n));

	return (
		<main className="bg-tk-bg pt-[68px]">
			{/* Masthead */}
			<section className="border-tk-border border-b">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid gap-10 lg:grid-cols-[1.1fr_minmax(0,26rem)] lg:items-start lg:gap-14">
						<div>
							<p className="font-code text-[0.7rem] text-tk-eyebrow uppercase tracking-[0.16em]">
								{en ? "Pricing" : "Tarification"}
							</p>
							<h1 className="mt-4 max-w-[20ch] font-display font-extrabold text-[clamp(2rem,1.3rem+2.6vw,3.25rem)] text-tk-title leading-[1.04] tracking-[-0.035em]">
								{en
									? "Two lines, one tier, no surprises."
									: "Deux lignes, un palier, aucune surprise."}
							</h1>
							<p className="mt-5 max-w-[56ch] font-body text-[1.05rem] text-tk-ink-2 leading-relaxed">
								{en
									? "No file fee, no activation fee, no hosting billed separately. Every franc is written down, explained and checkable on a calculator."
									: "Pas de frais de dossier, pas de frais d'activation, pas d'hébergement facturé à part. Chaque franc est écrit, expliqué et vérifiable à la calculatrice."}
							</p>
						</div>
						<Calculateur locale={locale} />
					</div>
				</div>
			</section>

			{/* Billed lines */}
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<h2 className="font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
					{en ? "What is actually billed" : "Ce qui est réellement facturé"}
				</h2>

				<div className="mt-8 overflow-x-auto rounded-xl border border-tk-border">
					<table className="w-full border-collapse">
						<thead>
							<tr className="bg-tk-dark">
								{[
									en ? "Billed line" : "Ligne facturée",
									en ? "Amount" : "Montant",
									en ? "What that franc pays for" : "Ce que ce franc paie",
									en ? "Frequency" : "Fréquence",
								].map((h) => (
									<th
										key={h}
										className="px-4 py-3.5 text-left font-body font-semibold text-[0.78rem] text-tk-on-dark sm:px-5"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="bg-tk-surface">
							{lines.map((l) => (
								<tr
									key={l.name}
									className="border-tk-border border-b last:border-0"
								>
									<th
										scope="row"
										className="px-4 py-4 text-left align-top font-body font-semibold text-[0.88rem] text-tk-ink sm:px-5"
									>
										{l.name}
									</th>
									<td className="px-4 py-4 align-top sm:px-5">
										<span className="block font-bold font-display text-[1rem] text-tk-primary-deep tabular-nums">
											{l.amount}
										</span>
										{l.sub ? (
											<span className="block font-body text-[0.72rem] text-tk-muted">
												{l.sub}
											</span>
										) : null}
									</td>
									<td className="max-w-[34rem] px-4 py-4 align-top font-body text-[0.85rem] text-tk-ink-2 leading-relaxed sm:px-5">
										{l.pays}
									</td>
									<td className="px-4 py-4 align-top font-body text-[0.8rem] text-tk-muted sm:px-5">
										{l.freq}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Degressive bands + pioneer */}
				<div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
					<div className="rounded-xl bg-tk-dark p-6 text-tk-on-dark lg:p-7">
						<p className="font-body font-semibold text-[0.9rem] text-tk-primary-bright">
							{en
								? "Degressive rate by headcount"
								: "Barème dégressif selon l'effectif"}
						</p>
						<div className="mt-5 grid gap-5 sm:grid-cols-3">
							{STUDENT_BANDS.map((b, i) => (
								<div key={b.label}>
									<p className="font-display font-extrabold text-[1.6rem] tabular-nums leading-none">
										{fcfa.format(b.rate)} F
									</p>
									<p className="mt-1.5 font-body text-[0.78rem] text-tk-on-dark-muted leading-snug">
										{en
											? [
													"for the first 500 students",
													"from the 501st to the 1 500th",
													"beyond the 1 500th",
												][i]
											: b.label}
									</p>
								</div>
							))}
						</div>
						<p className="mt-5 border-white/12 border-t pt-4 font-body text-[0.82rem] text-tk-on-dark-soft leading-relaxed">
							{en
								? "Standard to Pro does not change the per-student price — only isolation and the service commitment."
								: "Standard → Pro ne change pas le prix par étudiant, seulement l'isolation et l'engagement de service."}
						</p>
					</div>

					<div className="rounded-xl border border-tk-primary/40 bg-tk-primary-soft p-6 lg:p-7">
						<p className="font-display font-extrabold text-[2.2rem] text-tk-primary-deep leading-none tracking-[-0.04em]">
							−{Math.round(PIONEER_DISCOUNT * 100)} %
						</p>
						<p className="mt-3 font-body font-semibold text-[0.9rem] text-tk-ink">
							{en ? "Pioneer discount" : "Remise pionniers"}
						</p>
						<p className="mt-2 font-body text-[0.85rem] text-tk-ink-2 leading-relaxed">
							{en
								? "Early signatories get 10 % off every amount on this page, held for the whole duration of the first commitment. Written into the quote, not promised verbally."
								: "Les premiers signataires bénéficient de 10 % sur l'ensemble des montants de cette page, acquis pour toute la durée du premier engagement. Écrite dans le devis, pas promise à l'oral."}
						</p>
					</div>
				</div>
			</section>

			{/* Simulations */}
			<section className="border-tk-border border-y bg-tk-bg-deep">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<h2 className="max-w-[24ch] font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
						{en
							? "Four institution sizes, the calculation in the open"
							: "Quatre tailles d'établissement, calcul apparent"}
					</h2>
					<p className="mt-4 max-w-[54ch] font-body text-[0.95rem] text-tk-ink-2 leading-relaxed">
						{en
							? "No favourable rounding. Replace our administrator assumption with yours: the calculation stays checkable by hand."
							: "Aucun arrondi favorable. Remplacez l'hypothèse d'administrateurs par la vôtre : le calcul reste vérifiable à la main."}
					</p>

					<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{simulations.map((s) => (
							<div
								key={s.students}
								className="rounded-xl border border-tk-border bg-tk-surface p-5"
							>
								<p className="font-code text-[0.65rem] text-tk-muted uppercase tracking-[0.12em]">
									{fcfa.format(s.students)} {en ? "students" : "étudiants"}
								</p>
								<p className="mt-3 font-display font-extrabold text-[1.5rem] text-tk-ink tabular-nums leading-none tracking-[-0.03em]">
									{fcfa.format(s.total)}
								</p>
								<p className="mt-1 font-body text-[0.72rem] text-tk-muted">
									FCFA {en ? "excl. tax / year" : "HT / an"}
								</p>
								<p className="mt-3 border-tk-border border-t pt-3 font-body text-[0.78rem] text-tk-ink-2 leading-relaxed">
									{fcfa.format(s.studentCost)} + {s.admins} ×{" "}
									{fcfa.format(ADMIN_SEAT)}
									{s.atFloor ? (
										<span className="mt-1 block font-medium text-tk-eyebrow">
											{en ? "→ minimum tier" : "→ palier minimum"}
										</span>
									) : null}
								</p>
							</div>
						))}
					</div>

					<div className="mt-6 rounded-xl bg-tk-dark p-6 text-tk-on-dark lg:p-7">
						<p className="font-body font-semibold text-[0.9rem] text-tk-eyebrow">
							{en
								? "The threshold to know before signing"
								: "Le seuil qu'il faut connaître avant de signer"}
						</p>
						<p className="mt-3 max-w-[72ch] font-body text-[0.95rem] leading-relaxed">
							{en
								? "Below roughly 350 students, TKAMS costs you 1 000 000 FCFA a year whatever your real headcount. If that is your case and your need is limited to official documents, OnReceipt is the economically rational choice. We would rather sell you the right solution than the more expensive one."
								: "En dessous d'environ 350 étudiants, TKAMS vous coûte 1 000 000 FCFA par an quel que soit votre effectif réel. Si vous êtes dans ce cas et que votre besoin se limite aux documents officiels, OnReceipt est le choix économiquement rationnel. Nous préférons vous vendre la bonne solution que la plus chère."}
						</p>
						<Link
							href="/onreceipt"
							className="mt-5 inline-block font-body font-semibold text-[0.9rem] text-tk-primary-bright underline-offset-4 hover:underline"
						>
							{en ? "See OnReceipt pricing →" : "Voir les tarifs OnReceipt →"}
						</Link>
					</div>
				</div>
			</section>

			{/* Migration + options */}
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
					<div>
						<h2 className="max-w-[22ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.5vw,2.1rem)] text-tk-title leading-[1.1] tracking-[-0.03em]">
							{en ? "Migrating your history" : "La reprise de vos historiques"}
						</h2>
						<p className="mt-4 max-w-[48ch] font-body text-[0.95rem] text-tk-ink-2 leading-relaxed">
							{en
								? "The unit of account is one dossier-année = one student × one year of history restored. Total = for each cycle, headcount × years to record."
								: "L'unité de compte est le dossier-année = 1 étudiant × 1 année d'historique reprise. Total = pour chaque cycle, effectif × années à enregistrer."}
						</p>

						<dl className="mt-6 rounded-xl border border-tk-border bg-tk-surface">
							{MIGRATION_BANDS.map((b, i) => (
								<div
									key={b.rate}
									className="flex items-baseline justify-between gap-4 border-tk-border border-b px-5 py-3 last:border-0"
								>
									<dt className="font-body text-[0.875rem] text-tk-ink-2">
										{en
											? [
													"1st to 1 000th",
													"1 001st to 3 000th",
													"beyond the 3 000th",
												][i]
											: [
													"Du 1er au 1 000e",
													"Du 1 001e au 3 000e",
													"Au-delà du 3 000e",
												][i]}
									</dt>
									<dd className="font-bold font-display text-[1rem] text-tk-ink tabular-nums">
										{b.rate} FCFA
									</dd>
								</div>
							))}
						</dl>
						<p className="mt-3 font-body text-[0.82rem] text-tk-muted leading-relaxed">
							{en
								? `Flat minimum ${fcfa.format(MIGRATION_FLOOR)} FCFA. Paper archives or scanned PDFs: + 40 %. The current year is migrated free of charge.`
								: `Minimum forfaitaire ${fcfa.format(MIGRATION_FLOOR)} FCFA. Archives papier ou PDF scannés : + 40 %. L'année en cours est migrée gratuitement.`}
						</p>
						<p className="mt-4 rounded-lg border border-tk-primary/30 bg-tk-primary-soft p-4 font-body text-[0.85rem] text-tk-ink-2 leading-relaxed">
							{en
								? "You are never obliged to bring your history across: starting on the current year is a legitimate choice — free, and common."
								: "Vous n'êtes jamais obligé de reprendre votre historique : démarrer sur l'année en cours est un choix légitime, gratuit et fréquent."}
						</p>
					</div>

					<div>
						<h2 className="max-w-[22ch] font-display font-extrabold text-[clamp(1.5rem,1.1rem+1.5vw,2.1rem)] text-tk-title leading-[1.1] tracking-[-0.03em]">
							{en ? "Options that add up" : "Les options qui s'ajoutent"}
						</h2>
						<p className="mt-4 font-body text-[0.95rem] text-tk-ink-2 leading-relaxed">
							{en
								? "No option is added to a quote without your written request."
								: "Aucune option n'est ajoutée à un devis sans votre demande écrite."}
						</p>

						<ul className="mt-6 divide-y divide-tk-border rounded-xl border border-tk-border bg-tk-surface">
							{OPTIONS.map((o) => (
								<li key={o.name} className="p-5">
									<div className="flex flex-wrap items-baseline justify-between gap-3">
										<span className="font-body font-semibold text-[0.9rem] text-tk-ink">
											{o.name}
										</span>
										<span className="font-bold font-display text-[0.95rem] text-tk-eyebrow tabular-nums">
											{o.price} FCFA
										</span>
									</div>
									<p className="mt-1.5 font-body text-[0.82rem] text-tk-muted leading-relaxed">
										{o.note}
									</p>
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			{/* Where each franc goes */}
			<section className="border-tk-border border-y bg-tk-surface">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<h2 className="max-w-[24ch] font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] text-tk-title leading-[1.08] tracking-[-0.03em]">
						{en
							? "Why this price, and not another"
							: "Pourquoi ce prix, et pas un autre"}
					</h2>
					<p className="mt-4 max-w-[56ch] font-body text-[0.95rem] text-tk-ink-2 leading-relaxed">
						{en
							? "A vendor transparent about its amounts should also be transparent about how they are built. Here is what your subscription finances."
							: "Un éditeur transparent sur ses montants doit aussi être transparent sur leur construction. Voici ce que finance votre abonnement."}
					</p>

					{/* Proportional bar */}
					<div
						className="mt-8 flex overflow-hidden rounded-lg"
						role="img"
						aria-label={en ? "Cost breakdown" : "Répartition des coûts"}
					>
						{COST_BREAKDOWN.map((c, i) => (
							<div
								key={c.label}
								style={{ width: `${c.pct}%` }}
								className={`px-3 py-3 font-body font-semibold text-[0.78rem] ${
									[
										"bg-tk-primary text-tk-on-primary",
										"bg-tk-primary-bright text-tk-dark",
										"bg-tk-accent text-white",
										"bg-tk-accent-soft text-tk-eyebrow",
										"bg-tk-sand text-tk-ink",
									][i]
								}`}
							>
								<span className="block tabular-nums">{c.pct} %</span>
								<span className="block truncate font-medium text-[0.72rem] opacity-90">
									{c.label}
								</span>
							</div>
						))}
					</div>

					<dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
						{COST_BREAKDOWN.map((c) => (
							<div key={c.label} className="border-tk-border border-t pt-3">
								<dt className="font-body font-semibold text-[0.85rem] text-tk-ink">
									{c.label}
								</dt>
								<dd className="mt-1 font-body text-[0.82rem] text-tk-muted leading-relaxed">
									{c.detail}
								</dd>
							</div>
						))}
					</dl>

					<div className="mt-8 grid gap-4 sm:grid-cols-3">
						{[
							{
								n: "233 F",
								d: en
									? "per student per month, everything included — hosting, support, updates and official documents."
									: "par étudiant et par mois, tout compris — hébergement, support, mises à jour et documents officiels.",
							},
							{
								n: "0,5 – 0,8 %",
								d: en
									? "of a student's annual tuition. The norm for an academic information system is 1 to 2 %."
									: "des frais de scolarité annuels d'un étudiant. La norme d'un SI académique se situe entre 1 et 2 %.",
							},
							{
								n: "400 h",
								d: en
									? "of administrative work avoided per year, for 400 students — two and a half months of a full-time agent."
									: "de travail administratif évitées par an, pour 400 étudiants — deux mois et demi d'un agent à temps plein.",
							},
						].map((s) => (
							<div
								key={s.n}
								className="rounded-xl border border-tk-border bg-tk-bg-deep p-5"
							>
								<p className="font-display font-extrabold text-[1.7rem] text-tk-primary-deep leading-none tracking-[-0.03em]">
									{s.n}
								</p>
								<p className="mt-2.5 font-body text-[0.85rem] text-tk-ink-2 leading-relaxed">
									{s.d}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Not included */}
			<section className="relative overflow-hidden bg-tk-dark text-tk-on-dark">
				<div
					aria-hidden="true"
					className="tk-field-weave--on-dark pointer-events-none absolute inset-0"
				/>
				<div className="relative mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<p className="font-code text-[0.7rem] text-tk-eyebrow uppercase tracking-[0.16em]">
						{en ? "The most important page" : "La page la plus importante"}
					</p>
					<h2 className="mt-4 max-w-[24ch] font-display font-extrabold text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] leading-[1.08] tracking-[-0.03em]">
						{en ? "What is not included" : "Ce qui n'est pas inclus"}
					</h2>

					<p className="mt-4 max-w-[62ch] font-body text-[0.95rem] text-tk-on-dark-soft leading-relaxed">
						{en
							? "Six lines, and for each one, who carries it instead. An institution that discovers an exclusion after signature costs far more than one that walks away before."
							: "Six lignes, et pour chacune, qui la porte à la place. Un établissement qui découvre une exclusion après signature coûte bien plus cher qu'un établissement qui renonce avant."}
					</p>

					{/*
					 * Each exclusion pairs with its owner and its consequence. The flat
					 * bullet list this replaces had one weight of grey text on a dark
					 * field and answered none of the questions it raised.
					 */}
					<ul className="mt-9 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-2">
						{NOT_INCLUDED_DETAIL.map((row) => {
							const c = en ? row.en : row.fr;
							return (
								<li
									key={c.item}
									className="bg-tk-dark p-5 transition-colors hover:bg-white/[0.03] lg:p-6"
								>
									<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
										<h3 className="font-body font-semibold text-[0.95rem] text-tk-on-dark leading-snug">
											{c.item}
										</h3>
										<span className="whitespace-nowrap rounded-full border border-tk-accent/40 bg-tk-accent/10 px-2.5 py-0.5 font-body font-medium text-[0.68rem] text-tk-accent">
											{c.owner}
										</span>
									</div>
									<p className="mt-2.5 max-w-[52ch] font-body text-[0.85rem] text-tk-on-dark-muted leading-relaxed">
										{c.note}
									</p>
								</li>
							);
						})}
					</ul>

					<div className="mt-10 border-tk-accent border-l-[3px] bg-white/[0.04] px-6 py-7 lg:px-8">
						<p className="max-w-[60ch] font-bold font-display text-[clamp(1.1rem,0.95rem+0.7vw,1.5rem)] leading-snug tracking-[-0.02em]">
							{en
								? "Any amount not written on this page cannot be billed to you without a written amendment, signed by you."
								: "Tout montant qui ne figure pas sur cette page ne pourra pas vous être facturé sans un avenant écrit et signé par vous."}
						</p>
					</div>

					<Link
						href="/documents/Proposition commerciale TKAMS et QRCode 2026.pdf"
						className="mt-6 inline-block font-body font-medium text-[0.9375rem] text-tk-on-dark-soft underline-offset-4 hover:text-tk-on-dark hover:underline"
					>
						{en
							? "Download the full proposal (PDF, 19 pages)"
							: "Télécharger la proposition complète (PDF, 19 pages)"}
					</Link>
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
		title: en ? "Pricing — TKAMS" : "Tarifs — TKAMS",
		description: en
			? "Public pricing: 2 800 FCFA per student per year, degressive, 1 000 000 FCFA minimum tier. Migration, options and exclusions written down."
			: "Tarification publique : 2 800 FCFA par étudiant et par an, dégressif, palier minimum 1 000 000 FCFA. Migration, options et exclusions écrites.",
	};
}
