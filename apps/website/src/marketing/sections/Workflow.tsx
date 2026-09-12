import type { Dict, Locale } from "@/i18n";
import { DeliberationDemo } from "../app-demo/DeliberationDemo";
import { WORKFLOW_META } from "../domains-2026";
import { Reveal } from "../Reveal";

/**
 * Workflow — the nine stages of an academic year, then the screen where the
 * seventh one happens.
 *
 * ## Three columns, read left to right
 *
 * Two earlier versions were wrong in opposite directions. A 3×3 grid of bordered
 * cards said these nine things exist but nothing about their order — and a grid
 * is read left-then-down, which is not the shape of a year. A vertical timeline
 * fixed the order and cost roughly 1200px of page to say it.
 *
 * This reads the way a year actually runs: **three phases across, three stages
 * down each.** The horizontal axis is time — setting up, running, closing — so
 * the whole year is one screen wide and legible at a glance, and each column is
 * short enough that no stage needs scrolling to reach.
 *
 * Stages are separated by spacing and a single hairline per column rather than
 * by a box each: nine bordered cards drew around thirteen rules, which was a
 * large part of what made the page look like ruled paper.
 */

/** The three movements of an academic year, as the stage metadata describes them. */
const PHASES = [
	{
		stages: ["01", "02", "03"],
		fr: "Mise en place",
		en: "Setting up",
		frNote: "Avant la rentrée",
		enNote: "Before the year opens",
	},
	{
		stages: ["04", "05", "06"],
		fr: "L'année tourne",
		en: "The year runs",
		frNote: "Du premier jour au dernier cours",
		enNote: "First day to last class",
	},
	{
		stages: ["07", "08", "09"],
		fr: "Décider et clôturer",
		en: "Decide and close",
		frNote: "Jury, documents, promotion",
		enNote: "Jury, documents, progression",
	},
] as const;

export function Workflow({ dict: d, locale }: { dict: Dict; locale?: Locale }) {
	const en = locale === "en";

	return (
		<section className="bg-tk-bg">
			<div className="mx-auto max-w-[86rem] px-6 py-16 lg:px-10 lg:py-24">
				<div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-14">
					<div>
						<p className="font-code text-[0.7rem] text-tk-eyebrow uppercase tracking-[0.16em]">
							{en ? "The flow" : "Le flux"}
						</p>
						<h2 className="mt-4 font-display font-extrabold text-[clamp(1.75rem,1.1rem+2.2vw,2.75rem)] text-tk-title leading-[1.06] tracking-[-0.032em]">
							{d.workflow.title}
						</h2>
					</div>
					<p className="font-body text-[0.95rem] text-tk-ink-2 leading-relaxed lg:pb-1">
						{d.workflow.sub}{" "}
						{en
							? "Each stage consumes what the previous one produced: nothing is re-entered between them."
							: "Chaque étape consomme ce que la précédente a produit : rien n'est ressaisi entre elles."}
					</p>
				</div>

				<Reveal
					as="ol"
					stagger={60}
					className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3"
				>
					{PHASES.map((phase, phaseIndex) => (
						<li key={phase.en} className="min-w-0">
							{/*
							 * The phase rule doubles as the time axis: it runs across the
							 * top of each column, so the three of them read as one line
							 * broken into three movements.
							 */}
							<div className="flex items-baseline gap-3 border-tk-primary/30 border-t pt-3">
								<span className="font-display font-extrabold text-[0.8rem] text-tk-primary tabular-nums">
									{String(phaseIndex + 1).padStart(2, "0")}
								</span>
								<div className="min-w-0">
									<p className="font-body font-semibold text-[0.9rem] text-tk-ink leading-tight">
										{en ? phase.en : phase.fr}
									</p>
									<p className="mt-0.5 font-code text-[0.62rem] text-tk-muted uppercase tracking-[0.1em]">
										{en ? phase.enNote : phase.frNote}
									</p>
								</div>
							</div>

							<div className="mt-1">
								{phase.stages.map((num) => {
									const step = d.workflow.steps.find((s) => s.num === num);
									if (!step) return null;
									const meta = WORKFLOW_META[num];
									const when = meta ? (en ? meta.en.when : meta.fr.when) : null;
									const who = meta ? (en ? meta.en.who : meta.fr.who) : null;
									const isDemoStage = num === "07";

									return (
										<article
											key={num}
											className={`flex gap-3 py-3.5 ${
												isDemoStage
													? "-mx-3 mt-1 rounded-lg bg-tk-primary-soft px-3"
													: ""
											}`}
										>
											<span
												className={`shrink-0 font-display font-extrabold text-[0.9rem] tabular-nums leading-[1.5] ${
													isDemoStage ? "text-tk-primary" : "text-tk-primary/35"
												}`}
											>
												{num}
											</span>

											<div className="min-w-0">
												<div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
													<h3 className="font-bold font-display text-[0.975rem] text-tk-ink tracking-[-0.015em]">
														{step.title}
													</h3>
													<span className="font-code text-[0.6rem] text-tk-muted uppercase tracking-[0.08em]">
														{when}
													</span>
												</div>
												<p className="mt-1 font-body text-[0.8125rem] text-tk-ink-2 leading-[1.5]">
													{step.desc}
												</p>
												<p className="mt-1 font-body text-[0.72rem] text-tk-muted">
													{who}
													{isDemoStage ? (
														<span className="text-tk-primary">
															{en ? " · live below" : " · démo ci-dessous"}
														</span>
													) : null}
												</p>
											</div>
										</article>
									);
								})}
							</div>
						</li>
					))}
				</Reveal>

				{/* Stage 07, live and operable. */}
				<div className="mt-10">
					<DeliberationDemo
						locale={locale}
						caption={
							en
								? "Stage 07 · move the jury's rules, the cohort is re-decided."
								: "Étape 07 · déplacez les règles du jury, la cohorte est réévaluée."
						}
					/>
				</div>
			</div>
		</section>
	);
}
