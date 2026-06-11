"use client";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";
import { Showcase } from "../Showcase";

interface WorkflowProps {
	dict: Dict;
}

export function Workflow({ dict: d }: WorkflowProps) {
	return (
		<section className="bg-tk-surface">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<Rule />
				<div className="grid grid-cols-1 gap-x-12 gap-y-12 py-16 lg:grid-cols-12 lg:py-24">
					<div className="lg:col-span-4">
						<div className="lg:sticky lg:top-28">
							<SectionLabel number="05">Le flux</SectionLabel>
							<SectionHeading className="mt-6">
								{d.workflow.title}
							</SectionHeading>
							<Lede className="mt-5">{d.workflow.sub}</Lede>
						</div>
					</div>

					<div className="lg:col-span-8">
						<div className="grid grid-cols-1 sm:grid-cols-2">
							{d.workflow.steps.map((step, i) => (
								<AnimateIn key={step.num} delay={i * 70}>
									<div
										className={`h-full border-tk-border border-t py-7 ${
											i % 2 === 1 ? "sm:border-l sm:pl-8" : "sm:pr-8"
										}`}
									>
										<div className="flex items-baseline gap-3">
											<span className="font-display font-extrabold text-[2rem] text-tk-primary/25 tabular-nums leading-none">
												{step.num}
											</span>
											<span className="h-px flex-1 bg-tk-border" />
										</div>
										<h3 className="mt-4 font-bold font-display text-[1.0625rem] text-tk-ink tracking-[-0.02em]">
											{step.title}
										</h3>
										<p className="mt-2 font-body text-sm text-tk-ink-2 leading-[1.65]">
											{step.desc}
										</p>
									</div>
								</AnimateIn>
							))}
						</div>

						<AnimateIn mode="scale" delay={120}>
							<div className="mt-10">
								<Showcase
									variant="browser"
									url="app.tkams.com/pv"
									width={1800}
									height={1100}
									alt="Génération du PV de délibération dans TKAMS"
									label="Capture du flux — génération du PV / relevés officiels en un clic"
									caption="public/screenshots/workflow-pv.png · 1800 × 1100 px"
									sizes="(min-width: 1024px) 56rem, 100vw"
								/>
							</div>
						</AnimateIn>
					</div>
				</div>
			</div>
		</section>
	);
}
