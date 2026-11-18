import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n";
import { COMPARISON } from "@/marketing/pricing-2026";
import { PhotoBand } from "@/marketing/sections/PhotoBand";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";

/**
 * TKAMS vs OnReceipt — the twelve differences that decide (proposal p. 09).
 *
 * Published as its own page because it is the question every prospect actually
 * arrives with, and because answering it honestly — including the last row,
 * which sends urgent buyers to the cheaper product — is what makes the rest of
 * the site credible.
 */
export default async function Page() {
	const locale = await getLocale();
	const en = locale === "en";

	return (
		<main className="tk-dotgrid bg-tk-bg pt-[var(--tk-header-h)]">
			<section>
				<div className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
					<p className="font-code text-[length:var(--tk-text-xs)] text-tk-eyebrow uppercase tracking-[0.16em]">
						{en ? "Direct comparison" : "Comparatif direct"}
					</p>
					<h1 className="tk-display tk-gradient-text mt-4 max-w-[22ch]">
						{en
							? "The twelve differences that decide."
							: "Les douze différences qui décident."}
					</h1>
					<p className="mt-5 max-w-[58ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-relaxed">
						{en
							? "Two products, sold separately. One produces compliant documents today; the other runs the whole academic year. Here is every difference that matters, including the one that should send you to the cheaper option."
							: "Deux produits, vendus séparément. L'un produit des documents conformes dès aujourd'hui ; l'autre pilote toute l'année académique. Voici chaque différence qui compte, y compris celle qui doit vous orienter vers l'option la moins chère."}
					</p>
				</div>
			</section>

			{/*
			 * Between the comparison table and the closing cards. The table is the
			 * densest thing on this page; this lets the decision settle.
			 */}
			<PhotoBand
				src="/images/web/campus-groupe-2-band.webp"
				alt={
					en
						? "Students working together on campus"
						: "Des étudiants travaillant ensemble sur le campus"
				}
				caption={
					en
						? "Whichever you choose, the documents reach the same students."
						: "Quel que soit votre choix, les documents arrivent aux mêmes étudiants."
				}
			/>
			<section className="mx-auto max-w-[86rem] px-6 py-14 lg:px-10 lg:py-20">
				<div className="overflow-x-auto rounded-xl border border-tk-border">
					<table className="w-full border-collapse">
						<thead>
							<tr>
								<th className="bg-tk-dark px-4 py-3.5 text-left font-body font-semibold text-[length:var(--tk-text-sm)] text-tk-on-dark sm:px-5">
									{en ? "Criterion" : "Critère"}
								</th>
								<th className="bg-tk-accent px-4 py-3.5 text-left font-body font-semibold text-[length:var(--tk-text-sm)] text-white sm:px-5">
									QR Code OnReceipt
								</th>
								<th className="bg-tk-primary px-4 py-3.5 text-left font-body font-semibold text-[length:var(--tk-text-sm)] text-tk-on-primary sm:px-5">
									TKAMS
								</th>
							</tr>
						</thead>
						<tbody className="bg-tk-surface">
							{COMPARISON.map((row, i) => {
								const last = i === COMPARISON.length - 1;
								return (
									<tr
										key={row.criterion}
										className={`border-tk-border border-b last:border-0 ${
											last ? "bg-tk-primary-soft" : ""
										}`}
									>
										<th
											scope="row"
											className="px-4 py-3.5 text-left align-top font-body font-semibold text-[length:var(--tk-text-sm)] text-tk-ink sm:px-5"
										>
											{row.criterion}
										</th>
										<td
											className={`px-4 py-3.5 align-top font-body text-[length:var(--tk-text-sm)] leading-relaxed sm:px-5 ${
												last ? "font-semibold text-tk-eyebrow" : "text-tk-ink-2"
											}`}
										>
											{row.onreceipt}
										</td>
										<td
											className={`px-4 py-3.5 align-top font-body text-[length:var(--tk-text-sm)] leading-relaxed sm:px-5 ${
												last
													? "font-semibold text-tk-primary-deep"
													: "text-tk-ink-2"
											}`}
										>
											{row.tkams}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="mt-8 grid gap-5 lg:grid-cols-2">
					<div className="rounded-xl border border-tk-border bg-tk-bg-deep p-6">
						<h2 className="font-bold font-display text-[1.15rem] text-tk-ink tracking-[-0.02em]">
							{en
								? "Multi-supervision, either way"
								: "Le multi-tutelle, des deux côtés"}
						</h2>
						<p className="mt-3 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-relaxed">
							{en
								? "TKAMS: one instance, several entities — rules, thresholds, templates and roles per supervising body, with a single consolidated report. OnReceipt: one profile per body — logos, theme, unit structure, template — exportable, switched between batches."
								: "TKAMS : une instance, plusieurs entités — règles, seuils, modèles et rôles par tutelle, reporting consolidé unique. OnReceipt : un profil par tutelle — logos, thème, UE/EC, gabarit — exportable, changé entre deux lots."}
						</p>
						<p className="mt-4 font-body text-[length:var(--tk-text-sm)] text-tk-muted leading-relaxed">
							{en
								? "None of these cases is billed as an extra: multi-supervision is part of both products' base scope."
								: "Aucun de ces cas n'est facturé en supplément : le multi-tutelle fait partie du périmètre de base des deux solutions."}
						</p>
					</div>

					<div className="flex flex-col justify-between gap-5 rounded-xl bg-tk-dark p-6 text-tk-on-dark">
						<div>
							<h2 className="font-bold font-display text-[1.15rem] tracking-[-0.02em]">
								{en ? "Still unsure?" : "Toujours indécis ?"}
							</h2>
							<p className="mt-3 font-body text-[length:var(--tk-text-body)] text-tk-on-dark-soft leading-relaxed">
								{en
									? "One hour is enough to see your own data produce your own documents. The demonstration is free and commits you to nothing."
									: "Une heure suffit pour voir vos propres données produire vos propres documents. La démonstration est gratuite et ne vous engage à rien."}
							</p>
						</div>
						<div className="flex flex-wrap gap-3">
							<Link
								href="/contact"
								className="rounded-md bg-tk-primary px-5 py-3 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-on-primary transition-colors hover:bg-tk-primary-bright hover:text-tk-dark"
							>
								{en ? "Request a demo" : "Demander une démo"}
							</Link>
							<Link
								href="/tarifs"
								className="rounded-md border border-white/30 px-5 py-3 font-body font-semibold text-[length:var(--tk-text-body)] text-tk-on-dark transition-colors hover:bg-white/10"
							>
								{en ? "See all prices" : "Voir tous les tarifs"}
							</Link>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}

export const metadata: Metadata = {
	title: "TKAMS ou OnReceipt — comparatif direct",
	description:
		"Les douze différences entre la plateforme TKAMS et le logiciel QR Code OnReceipt : périmètre, mise en service, prix, travail simultané, migration, réversibilité.",
	openGraph: mergeOpenGraph({
		title: "TKAMS ou OnReceipt — comparatif direct",
		description:
			"Les douze différences entre la plateforme TKAMS et le logiciel QR Code OnReceipt : périmètre, mise en service, prix, travail simultané, migration, réversibilité.",
	}),
};
