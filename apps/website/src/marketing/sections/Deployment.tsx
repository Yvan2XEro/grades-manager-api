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

/**
 * The four modes are not four alternatives — they are one axis, running from
 * "we host everything" to "you host everything". Four identical cards hid that,
 * which is what made this the flattest chapter on the page: the reader saw a
 * menu where the content is actually a gradient.
 *
 * Each card now shows where it sits on that axis, as a four-step meter. The
 * fill is the share of the infrastructure the institution controls.
 */
const CONTROL_STEPS = 4;

interface DeploymentProps {
	dict: Dict;
	number?: string;
}

export function Deployment({ dict: d, number = "07" }: DeploymentProps) {
	return (
		<EditorialSection
			level="supporting"
			number={number}
			label="Déploiement"
			heading={d.deployment.title}
			lede={
				<p className="max-w-[42ch] font-body text-[length:var(--tk-text-lead)] text-tk-ink-2 leading-[1.7]">
					{d.deployment.sub}
				</p>
			}
		>
			{/* Names the axis the meters measure, so the graphic is not mute. */}
			<p className="mb-1 flex items-center justify-between gap-4 font-code text-[length:var(--tk-text-xs)] text-tk-muted uppercase tracking-[0.12em]">
				<span>{d.deployment.axis_low}</span>
				<span aria-hidden="true" className="h-px flex-1 bg-tk-border" />
				<span>{d.deployment.axis_high}</span>
			</p>

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
								<div className="flex items-center justify-between gap-4">
									<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tk-primary-soft text-tk-primary">
										<Icon size={22} strokeWidth={1.75} aria-hidden="true" />
									</span>
									{/*
									 * Control meter: how much of the stack the institution runs
									 * itself, from shared cloud (one step) to on-premise (four).
									 * Drawn rather than written, so the progression across the
									 * four cards is visible before any of them is read.
									 */}
									<span
										className="flex items-end gap-[3px]"
										aria-hidden="true"
										title={`${i + 1} / ${CONTROL_STEPS}`}
									>
										{Array.from({ length: CONTROL_STEPS }, (_, step) => (
											<span
												key={`${mode.title}-step-${step}`}
												className={`w-[5px] rounded-[1px] ${
													step <= i ? "bg-tk-primary" : "bg-tk-border-strong/45"
												}`}
												style={{ height: `${10 + step * 5}px` }}
											/>
										))}
									</span>
								</div>
								<span className="mt-5 inline-block font-code font-semibold text-[length:var(--tk-text-xs)] text-tk-primary uppercase tracking-[0.1em]">
									{mode.tag}
								</span>
								<h3 className="mt-2 font-bold font-display text-[length:var(--tk-text-lead)] text-tk-ink tracking-[-0.02em]">
									{mode.title}
								</h3>
								<p className="mt-2.5 font-body text-[length:var(--tk-text-body)] text-tk-ink-2 leading-[1.65]">
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
