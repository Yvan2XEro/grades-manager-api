"use client";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";

interface DeploymentProps {
	dict: Dict;
}

export function Deployment({ dict: d }: DeploymentProps) {
	return (
		<section className="bg-tk-bg-deep px-6 py-24">
			<div className="mx-auto max-w-7xl">
				<AnimateIn>
					<div className="mb-14 text-center">
						<h2 className="mb-3 font-display font-extrabold text-[clamp(1.875rem,4vw,2.75rem)] text-tk-ink tracking-[-0.04em]">
							{d.deployment.title}
						</h2>
						<p className="font-body text-[1.0625rem] text-tk-ink-2">
							{d.deployment.sub}
						</p>
					</div>
				</AnimateIn>

				<div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-5">
					{d.deployment.modes.map((mode, i) => (
						<AnimateIn key={mode.title} delay={i * 80}>
							<div className="hover:-translate-y-[3px] h-full cursor-default rounded-2xl border border-tk-border bg-tk-surface p-8 transition-all duration-200 hover:border-tk-primary hover:shadow-[0_8px_32px_oklch(0.48_0.2_277/0.1)]">
								<div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[0.875rem] border border-tk-border bg-tk-bg text-[2rem]">
									{mode.icon}
								</div>

								<span className="mb-3.5 inline-block rounded-full bg-tk-primary-soft px-2.5 py-[0.1875rem] font-bold font-code text-[0.7rem] text-tk-primary uppercase tracking-[0.05em]">
									{mode.tag}
								</span>

								<h3 className="mb-2.5 font-bold font-display text-[1.0625rem] text-tk-ink tracking-[-0.02em]">
									{mode.title}
								</h3>

								<p className="font-body text-[0.9rem] text-tk-ink-2 leading-[1.65]">
									{mode.desc}
								</p>
							</div>
						</AnimateIn>
					))}
				</div>
			</div>
		</section>
	);
}
