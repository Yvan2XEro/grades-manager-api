"use client";
import { Cloud, CloudCog, Database, Server } from "lucide-react";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { EditorialSection } from "../Editorial";

/**
 * Deployment-mode icons, mapped by card index rather than stored in the
 * dictionary. Icons are presentation, not content: keeping them out of the
 * i18n files stops a translator from having to carry a glyph, and keeps the
 * FR and EN dictionaries byte-identical on this block.
 *
 * Order matches `dict.deployment.modes`: mutualised SaaS, dedicated SaaS,
 * hybrid, on-premise.
 */
const MODE_ICONS = [Cloud, CloudCog, Database, Server] as const;

interface DeploymentProps {
	dict: Dict;
	number?: string;
}

export function Deployment({ dict: d, number = "07" }: DeploymentProps) {
	return (
		<EditorialSection
			number={number}
			label="Déploiement"
			heading={d.deployment.title}
			lede={
				<p className="max-w-[42ch] font-body text-[1.0625rem] text-tk-ink-2 leading-[1.7]">
					{d.deployment.sub}
				</p>
			}
			bg="bg-tk-bg"
		>
			<div className="grid grid-cols-1 sm:grid-cols-2">
				{d.deployment.modes.map((mode, i) => {
					const Icon = MODE_ICONS[i] ?? Cloud;
					return (
						<AnimateIn key={mode.title} delay={i * 80}>
							<div
								className={`h-full border-tk-border border-t p-7 sm:p-8 ${
									i % 2 === 1 ? "sm:border-l" : ""
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tk-primary-soft text-tk-primary">
										<Icon size={22} strokeWidth={1.75} aria-hidden="true" />
									</span>
									<span className="font-code text-[0.7rem] text-tk-muted tabular-nums">
										{String(i + 1).padStart(2, "0")}
									</span>
								</div>
								<span className="mt-5 inline-block font-code font-semibold text-[0.7rem] text-tk-primary uppercase tracking-[0.1em]">
									{mode.tag}
								</span>
								<h3 className="mt-2 font-bold font-display text-[1.0625rem] text-tk-ink tracking-[-0.02em]">
									{mode.title}
								</h3>
								<p className="mt-2.5 font-body text-[0.9rem] text-tk-ink-2 leading-[1.65]">
									{mode.desc}
								</p>
							</div>
						</AnimateIn>
					);
				})}
			</div>
		</EditorialSection>
	);
}
