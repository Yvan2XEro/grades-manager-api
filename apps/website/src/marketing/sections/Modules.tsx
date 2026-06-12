"use client";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { EditorialSection } from "../Editorial";

interface ModulesProps {
	dict: Dict;
	number?: string;
}

export function Modules({ dict: d, number = "04" }: ModulesProps) {
	return (
		<EditorialSection
			id="modules"
			number={number}
			label="Couverture fonctionnelle"
			heading={d.modules.title}
			lede={
				<p className="max-w-[42ch] font-body text-[1.0625rem] text-tk-ink-2 leading-[1.7]">
					{d.modules.sub}
				</p>
			}
			bg="bg-tk-bg"
		>
			<div className="flex flex-wrap gap-2.5">
				{d.modules.items.map((mod, i) => (
					<AnimateIn key={mod} delay={i * 25} mode="scale">
						<div className="flex cursor-default items-center gap-2 whitespace-nowrap rounded-md border border-tk-border bg-tk-surface px-3.5 py-2 font-body font-medium text-[0.875rem] text-tk-ink-soft transition-colors duration-150 hover:border-tk-primary hover:text-tk-primary">
							<span className="h-[5px] w-[5px] shrink-0 rounded-full bg-tk-primary/50" />
							{mod}
						</div>
					</AnimateIn>
				))}
			</div>

			<AnimateIn delay={300}>
				<div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-tk-border border-t pt-8">
					<div>
						<p className="font-body font-bold text-base text-tk-ink">
							Un module manque ?
						</p>
						<p className="mt-1 font-body text-[0.9rem] text-tk-ink-2">
							TKAMS est extensible. Parlez-nous de vos besoins spécifiques.
						</p>
					</div>
					<a href="/contact" className="tk-btn-outline shrink-0">
						Nous contacter →
					</a>
				</div>
			</AnimateIn>
		</EditorialSection>
	);
}
