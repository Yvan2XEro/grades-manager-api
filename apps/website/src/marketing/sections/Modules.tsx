"use client";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";

interface ModulesProps {
	dict: Dict;
}

export function Modules({ dict: d }: ModulesProps) {
	return (
		<section id="modules" className="bg-tk-bg px-6 py-24">
			<div className="mx-auto max-w-7xl">
				<AnimateIn>
					<div className="mb-14 text-center">
						<span className="mb-5 inline-block rounded-full border border-[oklch(0.48_0.2_277/0.2)] bg-tk-primary-soft px-3.5 py-1.5 font-code font-semibold text-[0.8125rem] text-tk-primary tracking-[0.05em]">
							COUVERTURE FONCTIONNELLE
						</span>
						<h2 className="mb-3 font-display font-extrabold text-[clamp(1.875rem,4vw,2.75rem)] text-tk-ink tracking-[-0.04em]">
							{d.modules.title}
						</h2>
						<p className="font-body text-[1.0625rem] text-tk-ink-2">
							{d.modules.sub}
						</p>
					</div>
				</AnimateIn>

				<div className="flex flex-wrap justify-center gap-2.5">
					{d.modules.items.map((mod, i) => (
						<AnimateIn key={mod} delay={i * 30} mode="scale">
							<div className="flex cursor-default items-center gap-2 whitespace-nowrap rounded-lg border border-tk-border bg-tk-surface px-[1.125rem] py-2.5 font-body font-medium text-sm text-tk-ink-soft transition-all duration-150 hover:border-tk-primary hover:bg-tk-primary-soft hover:text-tk-primary">
								<span className="h-[5px] w-[5px] shrink-0 rounded-full bg-tk-primary opacity-50" />
								{mod}
							</div>
						</AnimateIn>
					))}
				</div>

				<AnimateIn delay={400}>
					<div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-tk-border bg-tk-surface px-8 py-6">
						<div>
							<p className="mb-1 font-body font-bold text-base text-tk-ink">
								Un module manque ?
							</p>
							<p className="font-body text-[0.9rem] text-tk-ink-2">
								TKAMS est extensible. Parlez-nous de vos besoins spécifiques.
							</p>
						</div>
						<a href="/contact" className="tk-btn-outline shrink-0">
							Nous contacter →
						</a>
					</div>
				</AnimateIn>
			</div>
		</section>
	);
}
