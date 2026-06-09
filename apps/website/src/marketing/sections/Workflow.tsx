"use client";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";

interface WorkflowProps {
	dict: Dict;
}

export function Workflow({ dict: d }: WorkflowProps) {
	return (
		<section className="relative overflow-hidden bg-tk-dark px-6 py-24">
			<div className="tk-grid-pattern absolute inset-0 z-0" />

			<div className="relative z-[1] mx-auto max-w-7xl">
				<AnimateIn>
					<div className="mb-14 text-center">
						<h2 className="mb-3 font-display font-extrabold text-[clamp(1.875rem,4vw,2.75rem)] text-tk-on-dark tracking-[-0.04em]">
							{d.workflow.title}
						</h2>
						<p className="font-body text-[1.0625rem] text-tk-on-dark-soft">
							{d.workflow.sub}
						</p>
					</div>
				</AnimateIn>

				<div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px overflow-hidden rounded-[1.25rem] bg-white/6">
					{d.workflow.steps.map((step, i) => (
						<AnimateIn key={step.num} delay={i * 80}>
							<div className="relative h-full overflow-hidden bg-tk-dark-2 p-8 transition-colors duration-200 hover:bg-[oklch(0.2_0.05_264)]">
								<div
									className="absolute top-0 right-0 left-0 h-[2px]"
									style={{
										background:
											i === 0
												? "var(--tk-primary)"
												: i === d.workflow.steps.length - 1
													? "var(--tk-accent-emerald)"
													: `oklch(${0.48 + i * 0.025} ${0.2 - i * 0.01} 277)`,
									}}
								/>
								<span className="mb-3.5 block font-bold font-code text-[0.75rem] text-tk-primary-bright tracking-[0.05em]">
									{step.num}
								</span>
								<h3 className="mb-2.5 font-bold font-display text-[1.0625rem] text-tk-on-dark tracking-[-0.02em]">
									{step.title}
								</h3>
								<p className="font-body text-sm text-tk-on-dark-soft leading-[1.65]">
									{step.desc}
								</p>
							</div>
						</AnimateIn>
					))}
				</div>
			</div>
		</section>
	);
}
