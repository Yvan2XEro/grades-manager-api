import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/i18n";
import { Gallery, type Shot } from "@/marketing/onreceipt/Gallery";
import {
	fcfa,
	NOT_INCLUDED_ONRECEIPT,
	ONRECEIPT_MAJ_EXTENSION,
	ONRECEIPT_PERPETUAL,
	ONRECEIPT_TERM,
} from "@/marketing/pricing-2026";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";

/**
 * QR Code OnReceipt — the second product.
 *
 * Presented as the urgent answer rather than a lesser TKAMS: it ships the same
 * day, runs offline, and solves compliance and forgery on its own. The page
 * states its boundaries early, because a buyer who needs enrolment or
 * deliberations must be sent to TKAMS before they pay for the wrong thing.
 *
 * The screen gallery uses real captures of version 2.0.1 supplied by the
 * publisher. Unlike the TKAMS demo screens — which are redrawn in markup
 * because the seeded database is empty and the chrome is still English — these
 * show a finished French product with 150 students loaded, so the screenshots
 * are the stronger proof.
 *
 * Every amount reads from `pricing-2026.ts` (proposal pp. 07, 11, 13).
 */
export default async function Page() {
	const locale = await getLocale();
	const en = locale === "en";

	const shots: Shot[] = en
		? [
				{
					src: "/onreceipt/or-releve.png",
					width: 1918,
					height: 1021,
					title: "Student selection and preview",
					caption:
						"150 students loaded, filtered by grade and honours; the transcript opens beside the list, QR already in place.",
				},
				{
					src: "/onreceipt/or-import.png",
					width: 1123,
					height: 848,
					title: "Excel import",
					caption:
						"Column validation, automatic mapping, duplicate detection. 14 columns recognised, 6 automatic matches.",
				},
				{
					src: "/onreceipt/or-mapping.png",
					width: 1611,
					height: 756,
					title: "Column mapping",
					caption:
						"Each course unit paired with its Excel column, multi-semester mode included.",
				},
				{
					src: "/onreceipt/or-eligibilite.png",
					width: 1606,
					height: 836,
					title: "Eligibility",
					caption:
						"Eligible and non-eligible students, rate and average computed automatically before generation.",
				},
				{
					src: "/onreceipt/or-entetes.png",
					width: 842,
					height: 877,
					title: "Institution identity",
					caption:
						"Institution type, theme colour, font, and the three logos — institute, university, faculty.",
				},
				{
					src: "/onreceipt/or-placement.png",
					width: 1918,
					height: 1022,
					title: "QR placement",
					caption:
						"Drag the QR directly onto the real document. Batch PDF processing with a merged export.",
				},
				{
					src: "/onreceipt/or-qr.png",
					width: 1576,
					height: 811,
					title: "QR parameters",
					caption:
						"Error-correction level, size and position. Small, medium, large or custom.",
				},
				{
					src: "/onreceipt/or-aide.png",
					width: 1918,
					height: 1021,
					title: "Help and support",
					caption:
						"Quick-start guide, FAQ and support, built into the application.",
				},
				{
					src: "/onreceipt/or-licence.png",
					width: 1918,
					height: 1021,
					title: "Licence activation",
					caption:
						"Enter a key, or continue in demo mode — unlimited, watermarked.",
				},
			]
		: [
				{
					src: "/onreceipt/or-releve.png",
					width: 1918,
					height: 1021,
					title: "Sélection des étudiants et aperçu",
					caption:
						"150 étudiants chargés, filtrés par grade et mention ; le relevé s'ouvre à côté de la liste, QR déjà en place.",
				},
				{
					src: "/onreceipt/or-import.png",
					width: 1123,
					height: 848,
					title: "Import Excel",
					caption:
						"Validation des colonnes, correspondance automatique, détection des doublons. 14 colonnes détectées, 6 correspondances trouvées.",
				},
				{
					src: "/onreceipt/or-mapping.png",
					width: 1611,
					height: 756,
					title: "Correspondance des colonnes",
					caption:
						"Chaque élément constitutif associé à sa colonne Excel, mode multi-semestres inclus.",
				},
				{
					src: "/onreceipt/or-eligibilite.png",
					width: 1606,
					height: 836,
					title: "Éligibilité",
					caption:
						"Éligibles et non éligibles, taux et moyenne calculés automatiquement avant génération.",
				},
				{
					src: "/onreceipt/or-entetes.png",
					width: 842,
					height: 877,
					title: "Identité de l'établissement",
					caption:
						"Type d'établissement, couleur du thème, police, et les trois logos — IPES, université, faculté.",
				},
				{
					src: "/onreceipt/or-placement.png",
					width: 1918,
					height: 1022,
					title: "Positionnement du QR",
					caption:
						"Glissez le QR directement sur le document réel. Traitement PDF par lots avec export fusionné.",
				},
				{
					src: "/onreceipt/or-qr.png",
					width: 1576,
					height: 811,
					title: "Paramètres du QR",
					caption:
						"Niveau de correction d'erreur, taille et position. Small, medium, large ou personnalisé.",
				},
				{
					src: "/onreceipt/or-aide.png",
					width: 1918,
					height: 1021,
					title: "Aide et support",
					caption:
						"Guide de démarrage, questions fréquentes et contact, intégrés à l'application.",
				},
				{
					src: "/onreceipt/or-licence.png",
					width: 1918,
					height: 1021,
					title: "Activation de licence",
					caption:
						"Saisissez une clé, ou continuez en mode démo — illimité, avec filigrane.",
				},
			];

	const features = en
		? [
				{
					t: "Excel import",
					d: "Column validation, smart mapping to course units, duplicate and out-of-range detection.",
				},
				{
					t: "Academic structures",
					d: "Semesters, units, ECTS credits, coefficients. Configurations saved, exported and reused year to year.",
				},
				{
					t: "Transcripts",
					d: "Batch generation with progress, preview, vector PDF export, full ZIP archive.",
				},
				{
					t: "Certificates of success",
					d: "Automatic eligibility (average ≥ 10/20), grades and honours, live statistics, individual preview.",
				},
				{
					t: "Selection and filtering",
					d: "Filter by level, honours and eligibility; individual or batch selection before generation.",
				},
				{
					t: "Institution identity",
					d: "Institution, university and faculty logos, colours, fonts, professional themes. French or English edition.",
				},
				{
					t: "Anti-forgery",
					d: "AES-128 encrypted QR derived from the registration number, 50 to 80 character payload: smaller, more legible, non-reproducible.",
				},
				{
					t: "Traceability",
					d: "Timestamped history, filtering by period, type and student, statistics, metadata export, backup and restore.",
				},
			]
		: [
				{
					t: "Import & données",
					d: "Import Excel avec validation des colonnes, mapping intelligent vers les EC, détection des doublons et des notes hors barème.",
				},
				{
					t: "Structures académiques",
					d: "Semestres, UE, EC, crédits ECTS, coefficients. Configurations sauvegardables, exportables et réimportables d'une année sur l'autre.",
				},
				{
					t: "Relevés de notes",
					d: "Génération en lot avec progression, prévisualisation, export PDF vectoriel, archive ZIP complète.",
				},
				{
					t: "Attestations de réussite",
					d: "Éligibilité automatique (moyenne ≥ 10/20), grades et mentions, statistiques en temps réel, aperçu individuel.",
				},
				{
					t: "Sélection & filtrage",
					d: "Filtrage par niveau, mention et éligibilité ; sélection individuelle ou en lot avant génération.",
				},
				{
					t: "Identité de l'établissement",
					d: "Logos de l'établissement, de l'université et de la faculté, couleurs, polices, thèmes professionnels. Édition française ou anglaise.",
				},
				{
					t: "Sécurité anti-falsification",
					d: "QR chiffré AES-128 dérivé du matricule, charge utile de 50 à 80 caractères : un QR plus petit, plus lisible, non reproductible.",
				},
				{
					t: "Traçabilité & exploitation",
					d: "Historique horodaté, filtrage par période, type et étudiant, statistiques, export des métadonnées, sauvegarde et restauration.",
				},
			];

	const excluded = en
		? [
				"Enrolment, student records, fees, timetables",
				"Mark entry by teachers and deliberations",
				"A portal or app for students",
				"Simultaneous work: data stays local to the workstation",
				"Automatic backup off the workstation: exporting remains your responsibility",
				"Workstations beyond the number covered by the licence",
			]
		: [...NOT_INCLUDED_ONRECEIPT];

	return (
		<main className="tk-dotgrid bg-tk-bg pt-[var(--tk-header-h)]">
			{/* Hero */}
			<section className="relative overflow-hidden">
				{/*
				 * The same two washes every other page carries, so OnReceipt reads as
				 * part of the site rather than a separate product page. The accent
				 * weave stays: this is the one page whose brand is warm rather than
				 * violet, and it is what distinguishes the two products at a glance.
				 */}
				<div
					aria-hidden="true"
					className="tk-wash tk-wash--accent -top-32 -right-24 h-[420px] w-[420px]"
				/>
				<div
					aria-hidden="true"
					className="tk-wash tk-wash--primary -left-28 top-8 h-[320px] w-[320px]"
				/>
				<div
					aria-hidden="true"
					className="tk-field-weave--accent pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top_right,#000,transparent_68%)]"
				/>
				<div className="relative mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-14">
						<div>
							<div className="flex flex-wrap items-center gap-3">
								<Image
									src="/onreceipt/logo-onreceipt.png"
									alt="QR Code OnReceipt"
									width={256}
									height={256}
									className="size-12 object-contain"
									priority
								/>
								<span className="rounded-full border border-tk-border-strong px-3 py-1 font-body font-medium text-[length:var(--tk-text-xs)] text-tk-ink-2">
									{en ? "Urgent answer" : "Réponse d'urgence"}
								</span>
							</div>

							<h1 className="tk-display tk-gradient-text mt-6 max-w-[18ch]">
								{en
									? "Compliant documents, in batches, today."
									: "Des documents conformes, en lot, dès aujourd'hui."}
							</h1>
							<p className="mt-5 max-w-[52ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-relaxed">
								{en
									? "Desktop software that generates transcripts and certificates compliant with state university standards from an Excel file. Works offline. Windows 10+, macOS 10.15+, Linux."
									: "Un logiciel installé sur poste qui produit relevés et attestations conformes aux standards des universités d'État à partir d'un fichier Excel. Fonctionne hors ligne. Windows 10+, macOS 10.15+, Linux."}
							</p>

							<dl className="mt-9 grid grid-cols-2 gap-6 border-tk-border border-t pt-6 sm:grid-cols-3">
								<div>
									<dt className="font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.12em]">
										{en ? "Go-live" : "Mise en service"}
									</dt>
									<dd className="mt-1 font-bold font-display text-[length:var(--tk-text-lead)] text-tk-ink">
										{en ? "Same day to 48 h" : "Le jour même à 48 h"}
									</dd>
								</div>
								<div>
									<dt className="font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.12em]">
										{en ? "Entry ticket" : "Ticket d'entrée"}
									</dt>
									<dd className="mt-1 font-bold font-display text-[length:var(--tk-text-lead)] text-tk-ink tabular-nums">
										{fcfa.format(130_000)} F
									</dd>
								</div>
								<div>
									<dt className="font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.12em]">
										{en ? "Trial" : "Essai"}
									</dt>
									<dd className="mt-1 font-bold font-display text-[length:var(--tk-text-lead)] text-tk-eyebrow">
										{en ? "Free, unlimited" : "Gratuit, illimité"}
									</dd>
								</div>
							</dl>

							<div className="mt-8 flex flex-wrap gap-3">
								<Link
									href="/contact"
									className="rounded-md bg-tk-primary px-6 py-3.5 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-on-primary transition-colors hover:bg-tk-primary-deep"
								>
									{en ? "Request the demo version" : "Demander la version démo"}
								</Link>
								<Link
									href="/comparatif"
									className="rounded-md border border-tk-border-strong px-6 py-3.5 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-ink transition-colors hover:bg-tk-bg-deep"
								>
									{en ? "Compare with TKAMS" : "Comparer avec TKAMS"}
								</Link>
							</div>
						</div>

						{/* The document it produces — the strongest single proof. */}
						<div className="overflow-hidden rounded-xl border border-tk-border-strong bg-tk-surface shadow-[0_18px_44px_oklch(0.19_0.026_277/0.14)]">
							<Image
								src="/onreceipt/or-releve.png"
								alt={
									en
										? "OnReceipt: student list and generated transcript"
										: "OnReceipt : liste des étudiants et relevé de notes généré"
								}
								width={1918}
								height={1021}
								className="h-auto w-full"
								priority
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Gallery */}
			<section className="bg-tk-bg-deep">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div className="max-w-[44rem]">
							<p className="font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.16em]">
								{en ? "Screen by screen" : "Écran par écran"}
							</p>
							<h2 className="tk-headline tk-gradient-text mt-4">
								{en
									? "The real software, not a mockup."
									: "Le logiciel réel, pas une maquette."}
							</h2>
							<p className="mt-4 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
								{en
									? "Captures of version 2.0.1. These are the screens your registry office will use."
									: "Captures de la version 2.0.1. Ce sont les écrans que votre service de scolarité utilisera."}
							</p>
						</div>
						<span className="rounded-full border border-tk-border-strong bg-tk-surface px-3.5 py-1.5 font-body font-medium text-[length:var(--tk-text-sm)] text-tk-ink-2">
							Windows · macOS · Linux
						</span>
					</div>

					<div className="mt-9">
						<Gallery shots={shots} closeLabel={en ? "Close" : "Fermer"} />
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<h2 className="tk-headline tk-gradient-text max-w-[24ch]">
					{en ? "Everything the software does" : "Tout ce que fait le logiciel"}
				</h2>
				<div className="mt-9 grid gap-px overflow-hidden rounded-xl border border-tk-border bg-tk-border sm:grid-cols-2">
					{features.map((f) => (
						<div key={f.t} className="bg-tk-surface p-5 lg:p-6">
							<h3 className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-ink">
								{f.t}
							</h3>
							<p className="mt-2 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
								{f.d}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Pricing */}
			<section className="border-tk-border border-y bg-tk-bg-deep">
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<h2 className="tk-headline tk-gradient-text max-w-[26ch]">
						{en
							? "Same software. What changes: duration, seats, updates."
							: "Le même logiciel. Ce qui change : la durée, les postes, les mises à jour."}
					</h2>

					<h3 className="mt-10 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-eyebrow">
						{en ? "Fixed-term licences" : "Licences à durée limitée"}
					</h3>
					<div className="mt-3 overflow-x-auto rounded-xl border border-tk-border bg-tk-surface">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-tk-border border-b bg-tk-dark">
									{[
										en ? "Plan" : "Formule",
										en ? "Price" : "Prix",
										en ? "Duration" : "Durée",
										en ? "Seats" : "Postes",
										"Support",
										en ? "Limits to know" : "Limites à connaître",
									].map((h) => (
										<th
											key={h}
											className="px-4 py-3 text-left font-body font-semibold text-[length:var(--tk-text-xs)] text-tk-on-dark"
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{ONRECEIPT_TERM.map((p) => (
									<tr
										key={p.key}
										className="border-tk-border border-b last:border-0"
									>
										<th
											scope="row"
											className="px-4 py-3 text-left font-body font-semibold text-[length:var(--tk-text-sm)] text-tk-ink"
										>
											{p.name}
										</th>
										<td className="px-4 py-3 font-body font-semibold text-[length:var(--tk-text-sm)] text-tk-eyebrow tabular-nums">
											{p.price === 0
												? en
													? "Free"
													: "Gratuit"
												: fcfa.format(p.price)}
										</td>
										<td className="px-4 py-3 font-body text-[length:var(--tk-text-sm)] text-tk-ink-2">
											{p.duration}
										</td>
										<td className="px-4 py-3 font-body text-[length:var(--tk-text-sm)] text-tk-ink-2 tabular-nums">
											{p.seats}
										</td>
										<td className="px-4 py-3 font-body text-[length:var(--tk-text-sm)] text-tk-ink-2">
											{p.support}
										</td>
										<td className="px-4 py-3 font-body text-[length:var(--tk-text-sm)] text-tk-muted leading-relaxed">
											{p.limits}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<h3 className="mt-10 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-eyebrow">
						{en
							? "Perpetual licences — single payment"
							: "Licences perpétuelles — paiement unique"}
					</h3>
					<div className="mt-3 grid gap-5 lg:grid-cols-3">
						{ONRECEIPT_PERPETUAL.map((p) => (
							<div
								key={p.key}
								className={`rounded-xl border p-6 ${
									p.key === "premium"
										? "border-tk-primary bg-tk-primary-soft"
										: "border-tk-border bg-tk-surface"
								}`}
							>
								<div className="flex items-baseline justify-between gap-3">
									<h4 className="font-bold font-display text-[1.15rem] text-tk-ink tracking-[-0.02em]">
										{p.name}
									</h4>
									<span className="rounded-full border border-tk-border-strong px-2.5 py-0.5 font-body font-medium text-[length:var(--tk-text-xs)] text-tk-ink-2">
										{p.seats} {en ? "seats" : p.seats > 1 ? "postes" : "poste"}
									</span>
								</div>
								<p className="mt-4 font-display font-extrabold text-[1.85rem] text-tk-ink tabular-nums leading-none tracking-[-0.03em]">
									{fcfa.format(p.price)}{" "}
									<span className="font-body font-medium text-[length:var(--tk-text-sm)] tracking-normal">
										FCFA
									</span>
								</p>
								<p className="mt-2 font-body text-[length:var(--tk-text-sm)] text-tk-eyebrow">
									{en ? "Updates and support" : "MAJ et support"} · {p.updates}
								</p>
								<p className="mt-4 border-tk-border border-t pt-4 font-body text-[length:var(--tk-text-sm)] text-tk-ink-2 leading-relaxed">
									{p.adds}
								</p>
							</div>
						))}
					</div>

					<p className="mt-5 font-body text-[length:var(--tk-text-sm)] text-tk-muted leading-relaxed">
						{en
							? `Update extension: ${fcfa.format(ONRECEIPT_MAJ_EXTENSION)} FCFA per year, or 250 000 for three years at once. Optional, and can be taken out later — even after an interruption.`
							: `Extension des mises à jour : ${fcfa.format(ONRECEIPT_MAJ_EXTENSION)} FCFA par an, ou 250 000 pour trois ans d'un coup. Facultative, souscrite quand vous le décidez — même après interruption.`}
					</p>

					<div className="mt-8 rounded-xl bg-tk-dark p-6 text-tk-on-dark lg:p-7">
						<p className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-primary-bright">
							{en
								? "The switch-over calculation, without dressing"
								: "Le calcul du basculement, sans habillage"}
						</p>
						<p className="mt-3 max-w-[70ch] font-body text-[length:var(--tk-text-body)] text-tk-on-dark-soft leading-relaxed">
							{en
								? "Standard renewed: 250 000 FCFA a year — 750 000 over three years, 1 000 000 over four. Perpetual Essentielle: 770 000 once. It becomes the cheaper purchase from the fourth year, not before. Over two or three years the Standard is better for you, and we say so."
								: "Standard renouvelée : 250 000 FCFA par an, soit 750 000 sur trois ans, 1 000 000 sur quatre. Perpétuelle Essentielle : 770 000 une seule fois — l'achat le plus économique à partir de la quatrième année, pas avant. Sur deux ou trois ans, la Standard est meilleure pour vous, et nous vous le disons."}
						</p>
					</div>
				</div>
			</section>

			{/* Boundaries */}
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
					<div>
						<h2 className="tk-headline tk-gradient-text max-w-[22ch]">
							{en
								? "What OnReceipt does not do"
								: "Ce qu'OnReceipt ne fait pas"}
						</h2>
						<p className="mt-4 max-w-[48ch] font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
							{en
								? "If any line below is part of your need, OnReceipt is the wrong purchase and TKAMS is the right one. Better said now than after signature."
								: "Si l'une des lignes ci-dessous fait partie de votre besoin, OnReceipt est le mauvais achat et TKAMS le bon. Mieux vaut le dire maintenant qu'après signature."}
						</p>
						<Link
							href="/produit"
							className="mt-6 inline-block font-body font-semibold text-[length:var(--tk-text-body)] text-tk-eyebrow underline-offset-4 hover:underline"
						>
							{en ? "See TKAMS instead →" : "Voir TKAMS à la place →"}
						</Link>
					</div>

					<ul className="rounded-xl border border-tk-border bg-tk-bg-deep p-6 lg:p-7">
						{excluded.map((item) => (
							<li
								key={item}
								className="flex gap-3 border-tk-border border-b py-2.5 first:pt-0 last:border-0 last:pb-0"
							>
								<span
									aria-hidden="true"
									className="mt-2.5 h-px w-3 flex-none bg-tk-accent"
								/>
								<span className="font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
									{item}
								</span>
							</li>
						))}
					</ul>
				</div>
			</section>
		</main>
	);
}

export const metadata: Metadata = {
	title: "QR Code OnReceipt — relevés et attestations conformes",
	description:
		"Logiciel de bureau qui produit en lot des relevés de notes et attestations conformes aux standards des universités d'État, avec QR chiffré AES-128. Hors ligne, mise en service en 48 h.",
	openGraph: mergeOpenGraph({
		title: "QR Code OnReceipt — relevés et attestations conformes",
		description:
			"Logiciel de bureau qui produit en lot des relevés de notes et attestations conformes aux standards des universités d'État, avec QR chiffré AES-128. Hors ligne, mise en service en 48 h.",
	}),
};
