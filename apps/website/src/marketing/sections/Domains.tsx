import Link from "next/link";
import type { Dict } from "@/i18n";
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

export function Domains({ dict: d }: { dict: Dict }) {
	const copy = d.domains;

	return (
		<section id="modules" className="bg-tk-bg">
			<div className="mx-auto max-w-[86rem] px-6 py-16 lg:px-10 lg:py-24">
				<div className="flex flex-wrap items-end justify-between gap-6">
					<h2 className="max-w-[20ch] font-display font-extrabold text-[clamp(1.75rem,1.1rem+2.2vw,2.75rem)] text-tk-title leading-[1.06] tracking-[-0.032em]">
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
						className="font-body font-semibold text-[0.9375rem] text-tk-primary-deep underline underline-offset-4 hover:text-tk-primary"
					>
						{copy.link}
					</Link>
				</div>

				<Reveal
					stagger={60}
					className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
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
										<p className="mt-2 font-body text-[0.85rem] leading-snug opacity-90">
											{c?.desc}
										</p>
									</div>
								</div>
								<ul className="divide-y divide-tk-border">
									{dom.items.map((item) => (
										<li
											key={item}
											className="px-5 py-2.5 font-body text-[0.85rem] text-tk-ink-2"
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
