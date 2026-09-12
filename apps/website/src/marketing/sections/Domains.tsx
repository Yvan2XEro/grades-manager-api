import Link from "next/link";
import type { Dict, Locale } from "@/i18n";
import { IsoStack } from "../Isometric";
import { Reveal } from "../Reveal";

/**
 * Domains — the routing grid, borrowed from the way French school-software
 * publishers organise a homepage: a colour per domain, a band carrying it, and
 * a short list of what sits underneath.
 *
 * Why a colour per domain rather than one accent everywhere: the product's
 * pitch is that forty-five modules finally live in one place. A single flat
 * accent would state that as a sentence; four bands state it as a picture, and
 * the reader can see the scope before reading a word.
 *
 * The bands alternate two depths of the brand violet rather than four different
 * hues. Four saturated colours in one row read as a chart legend, not as one
 * system — and the warm one failed contrast outright: `--color-tk-accent` is
 * documented as fills-and-motifs-only and was carrying an h3 and a paragraph.
 */

const DOMAINS = [
	{
		key: "scolarite",
		band: "bg-tk-primary text-tk-on-primary",
		items: ["Admissions", "Inscriptions", "Étudiants", "Classes"],
	},
	{
		key: "evaluation",
		band: "bg-tk-primary-deep text-tk-on-primary",
		items: ["Examens", "Notes & moyennes", "Délibérations", "Promotion"],
	},
	{
		key: "finances",
		band: "bg-tk-primary text-tk-on-primary",
		items: ["Ordres de paiement", "Quitus", "Relances", "Exports"],
	},
	{
		key: "documents",
		band: "bg-tk-primary-deep text-tk-on-primary",
		items: ["Relevés", "Attestations", "Diplômes", "DIPLOMATION"],
	},
] as const;

export function Domains({ dict: d, locale }: { dict: Dict; locale: Locale }) {
	const copy = d.domains;
	const en = locale === "en";

	return (
		<section id="modules">
			<div className="tk-section mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="flex flex-wrap items-end justify-between gap-6">
					<h2 className="tk-headline tk-gradient-text max-w-[20ch]">
						{copy.title}
					</h2>
					{/*
					 * Points at /fonctionnalites, not /produit.
					 *
					 * The label reads "Voir les 45 modules →" and used to land on a page
					 * that describes nine domains in a paragraph each and lists no
					 * modules at all — the site was promising a destination it had never
					 * built. It exists now.
					 */}
					<Link
						href="/fonctionnalites"
						className="font-body font-semibold text-[length:var(--tk-text-body)] text-tk-primary-deep underline underline-offset-4 hover:text-tk-primary"
					>
						{copy.link}
					</Link>
				</div>

				{/*
				 * The stack states the claim; the grid below details it.
				 *
				 * "Une seule base de données, aucune ressaisie entre les modules" is
				 * the sentence the commercial proposal leads this section with, and it
				 * was carried by type alone. Four slabs that pull apart on hover say
				 * it before a word is read: the domains are distinct, and they are one
				 * object. Vector rather than a render, so it re-tints with the theme
				 * and costs about 4 KB — see `Isometric.tsx`.
				 */}
				<div className="mt-12 grid items-center gap-x-12 gap-y-8 lg:grid-cols-12">
					<Reveal className="lg:col-span-5">
						<IsoStack
							locale={locale}
							slabs={[
								{
									label: en ? "Enrolment" : "Inscriptions",
									scene: "enrolment",
									accent: "var(--tk-primary)",
								},
								{
									label: en ? "Marks" : "Notes",
									scene: "marks",
									accent: "var(--tk-primary)",
								},
								{
									label: en ? "Deliberation" : "Délibération",
									scene: "deliberation",
									accent: "var(--tk-accent-deep)",
								},
								{
									label: "Documents",
									scene: "documents",
									accent: "var(--tk-primary-deep)",
								},
							]}
						/>
					</Reveal>

					<Reveal className="lg:col-span-6 lg:col-start-7 lg:pb-10">
						<p className="font-code text-[0.7rem] text-tk-eyebrow uppercase tracking-[0.16em]">
							{en ? "One database" : "Une seule base"}
						</p>
						<p className="mt-4 max-w-[44ch] font-body text-[1.05rem] text-tk-ink-2 leading-relaxed">
							{en
								? "A mark entered by a teacher is the same mark the jury deliberates on and the same mark printed on the transcript. Nothing is re-keyed between modules, because there is nothing to re-key into."
								: "Une note saisie par un enseignant est la même note que le jury délibère et la même note qu'imprime le relevé. Rien n'est ressaisi d'un module à l'autre, parce qu'il n'y a nulle part où ressaisir."}
						</p>
					</Reveal>
				</div>

				<Reveal
					stagger={60}
					className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
				>
					{DOMAINS.map((dom, i) => {
						const c = copy.items[i];
						return (
							<div
								key={dom.key}
								className="tk-lift overflow-hidden rounded-lg border border-tk-border bg-tk-surface"
							>
								<div
									className={`relative overflow-hidden px-5 py-7 ${dom.band}`}
								>
									{/* Woven lattice inside the band — the motif as texture. */}
									<div
										aria-hidden="true"
										className="tk-field-weave--on-dark pointer-events-none absolute inset-0"
									/>
									<div className="relative">
										<h3 className="font-bold font-display text-[1.25rem] tracking-[-0.02em]">
											{c?.name}
										</h3>
										<p className="mt-2 font-body text-[length:var(--tk-text-sm)] leading-snug opacity-90">
											{c?.desc}
										</p>
									</div>
								</div>
								<ul className="divide-y divide-tk-border">
									{dom.items.map((item) => (
										<li
											key={item}
											className="px-5 py-2.5 font-body text-[length:var(--tk-text-sm)] text-tk-ink-2"
										>
											{item}
										</li>
									))}
								</ul>
							</div>
						);
					})}
				</Reveal>
			</div>
		</section>
	);
}
