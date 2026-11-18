import {
	Award,
	BadgeCheck,
	Banknote,
	ClipboardList,
	FileSignature,
	FileSpreadsheet,
	GraduationCap,
	LayoutGrid,
	Receipt,
	Scale,
	ScrollText,
	Send,
	TrendingUp,
	UserPlus,
	Users,
	Wallet,
} from "lucide-react";
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
 *
 * ## What the cards had to say and were not saying
 *
 * The first version listed four labels of equal weight under each band —
 * "Admissions, Inscriptions, Étudiants, Classes" — which reads as a bag of
 * features. It is not a bag: it is the order a student moves through, and the
 * four domains are themselves a chain, Scolarité → Évaluation → Finances →
 * Documents. That is the section's whole argument ("one database, nothing
 * re-keyed"), and the grid was the one place on the page that could show it
 * rather than assert it.
 *
 * So the card now carries three things it did not:
 *
 *   - **Rank.** Each domain is numbered and captioned with where it sits in the
 *     year. The reader sees a sequence, not a menu.
 *   - **Direction.** Rows are steps, marked with a hairline spine and a glyph
 *     per step. The spine is a real line through the card, so the eye travels
 *     down it — the flat `divide-y` gave every row the same standing.
 *   - **An outlet.** The last row of each domain is what the domain *produces*
 *     and it is emphasised, because that output is the input of the next card.
 *
 * Icons come from lucide, already a dependency and already the product's own
 * icon set (`apps/web` uses it), so the marketing site and the software speak
 * the same visual language.
 */

/** One step inside a domain: an icon and its label, in the order it happens. */
type Step = { icon: typeof UserPlus; fr: string; en: string };

const DOMAINS = [
	{
		key: "scolarite",
		band: "bg-tk-primary text-tk-on-primary",
		icon: Users,
		/** Where this domain sits in the year — the caption under the number. */
		phase: { fr: "En entrée", en: "Intake" },
		steps: [
			{ icon: ClipboardList, fr: "Admissions", en: "Applications" },
			{ icon: UserPlus, fr: "Inscriptions", en: "Enrolment" },
			{ icon: GraduationCap, fr: "Étudiants", en: "Students" },
			{ icon: LayoutGrid, fr: "Classes", en: "Classes" },
		] satisfies Step[],
	},
	{
		key: "evaluation",
		band: "bg-tk-primary-deep text-tk-on-primary",
		icon: Scale,
		phase: { fr: "En cours d'année", en: "Through the year" },
		steps: [
			{ icon: FileSpreadsheet, fr: "Examens", en: "Exams" },
			{ icon: ClipboardList, fr: "Notes & moyennes", en: "Marks & averages" },
			{ icon: Scale, fr: "Délibérations", en: "Deliberations" },
			{ icon: TrendingUp, fr: "Promotion", en: "Progression" },
		] satisfies Step[],
	},
	{
		key: "finances",
		band: "bg-tk-primary text-tk-on-primary",
		icon: Wallet,
		phase: { fr: "En parallèle", en: "Alongside" },
		steps: [
			{ icon: Receipt, fr: "Ordres de paiement", en: "Payment orders" },
			{ icon: BadgeCheck, fr: "Quitus", en: "Clearance" },
			{ icon: Send, fr: "Relances", en: "Reminders" },
			{ icon: Banknote, fr: "Exports", en: "Exports" },
		] satisfies Step[],
	},
	{
		key: "documents",
		band: "bg-tk-primary-deep text-tk-on-primary",
		icon: FileSignature,
		phase: { fr: "En sortie", en: "Output" },
		steps: [
			{ icon: ScrollText, fr: "Relevés", en: "Transcripts" },
			{ icon: FileSignature, fr: "Attestations", en: "Certificates" },
			{ icon: Award, fr: "Diplômes", en: "Diplomas" },
			{ icon: BadgeCheck, fr: "DIPLOMATION", en: "DIPLOMATION" },
		] satisfies Step[],
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
						const DomIcon = dom.icon;
						const last = dom.steps.length - 1;
						return (
							<div
								key={dom.key}
								className="tk-lift group/card relative flex flex-col overflow-hidden rounded-lg border border-tk-border bg-tk-surface"
							>
								<div
									className={`relative overflow-hidden px-5 pt-5 pb-6 ${dom.band}`}
								>
									{/* Woven lattice inside the band — the motif as texture. */}
									<div
										aria-hidden="true"
										className="tk-field-weave--on-dark pointer-events-none absolute inset-0"
									/>
									{/*
									 * The domain's own glyph, large and half-bled off the corner.
									 * At 8 % it is a watermark, not an illustration: it gives the
									 * band something to be made of without competing with the
									 * title sitting on it.
									 */}
									<DomIcon
										aria-hidden="true"
										strokeWidth={1.25}
										className="-top-3 -right-3 pointer-events-none absolute size-[5.5rem] opacity-[0.08] transition-transform duration-500 group-hover/card:scale-110"
									/>

									<div className="relative">
										{/*
										 * Rank, then phase. The number is not decoration here —
										 * the four domains run in order across the year, and the
										 * caption underneath says which moment this one owns.
										 */}
										<p className="flex items-baseline gap-2 font-code text-[length:var(--tk-text-xs)] uppercase tracking-[0.14em] opacity-80">
											<span className="font-semibold text-[0.95rem] tabular-nums">
												{String(i + 1).padStart(2, "0")}
											</span>
											<span aria-hidden="true" className="opacity-50">
												/
											</span>
											<span>{en ? dom.phase.en : dom.phase.fr}</span>
										</p>
										<h3 className="mt-3 font-bold font-display text-[1.25rem] tracking-[-0.02em]">
											{c?.name}
										</h3>
										<p className="mt-2 font-body text-[length:var(--tk-text-sm)] leading-snug opacity-90">
											{c?.desc}
										</p>
									</div>
								</div>

								{/*
								 * The steps, as a spine rather than as a divided list.
								 *
								 * The hairline runs behind the glyph column and stops at the
								 * final row, so the eye reads a path with an end instead of
								 * four interchangeable lines. The last step is what the domain
								 * hands to the next one — hence the filled marker and the
								 * heavier ink.
								 */}
								<ol className="relative flex-1 px-5 py-4">
									<span
										aria-hidden="true"
										className="absolute top-7 bottom-7 left-[1.72rem] w-px bg-tk-border"
									/>
									{dom.steps.map((step, s) => {
										const StepIcon = step.icon;
										const isOutlet = s === last;
										return (
											<li
												key={step.fr}
												className="relative flex items-center gap-3 py-[0.42rem]"
											>
												<span
													className={`relative z-10 flex size-7 flex-none items-center justify-center rounded-full border transition-colors ${
														isOutlet
															? "border-tk-primary bg-tk-primary text-tk-on-primary"
															: "border-tk-border bg-tk-surface text-tk-primary-deep"
													}`}
												>
													<StepIcon
														size={14}
														strokeWidth={1.9}
														aria-hidden="true"
													/>
												</span>
												<span
													className={`font-body text-[length:var(--tk-text-sm)] ${
														isOutlet
															? "font-semibold text-tk-ink"
															: "text-tk-ink-2"
													}`}
												>
													{en ? step.en : step.fr}
												</span>
											</li>
										);
									})}
								</ol>
							</div>
						);
					})}
				</Reveal>
			</div>
		</section>
	);
}
