"use client";
import Link from "next/link";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";

interface PricingProps {
	dict: Dict;
}

export function Pricing({ dict: d }: PricingProps) {
	return (
		<section id="pricing" className="bg-tk-bg px-6 py-24">
			<div className="mx-auto max-w-7xl">
				<AnimateIn>
					<div className="mb-14 text-center">
						<span className="mb-5 inline-block rounded-full border border-[oklch(0.48_0.2_277/0.2)] bg-tk-primary-soft px-3.5 py-[0.3125rem] font-code font-semibold text-[0.8125rem] text-tk-primary tracking-[0.05em]">
							TARIFICATION
						</span>
						<h2 className="mb-3 font-display font-extrabold text-[clamp(1.875rem,4vw,2.75rem)] text-tk-ink tracking-[-0.04em]">
							{d.pricing.title}
						</h2>
						<p className="font-body text-[1.0625rem] text-tk-ink-2">
							{d.pricing.sub}
						</p>
					</div>
				</AnimateIn>

				<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-stretch gap-6">
					{d.pricing.plans.map((plan, i) => (
						<AnimateIn key={plan.name} delay={i * 100}>
							<div
								className={`relative flex h-full flex-col overflow-hidden rounded-[1.25rem] p-8 ${
									plan.featured
										? "border-2 border-tk-primary bg-tk-dark shadow-[0_24px_60px_oklch(0.48_0.2_277/0.2)]"
										: "border border-tk-border bg-tk-surface"
								}`}
							>
								{plan.featured && (
									<div className="absolute top-0 right-0 left-0 h-[3px] bg-[linear-gradient(90deg,var(--tk-primary),var(--tk-primary-bright))]" />
								)}

								<div className="mb-6">
									<div className="mb-2 flex items-center justify-between">
										<h3
											className={`font-bold font-display text-xl tracking-[-0.02em] ${
												plan.featured ? "text-tk-on-dark" : "text-tk-ink"
											}`}
										>
											{plan.name}
										</h3>
										{plan.badge && (
											<span className="rounded-full bg-tk-primary px-3 py-1 font-bold font-code text-[0.75rem] text-white">
												{plan.badge}
											</span>
										)}
									</div>
									<p
										className={`font-body text-sm leading-relaxed ${
											plan.featured ? "text-tk-on-dark-soft" : "text-tk-ink-2"
										}`}
									>
										{plan.desc}
									</p>
								</div>

								<div
									className={`mb-6 border-b pb-6 ${
										plan.featured ? "border-white/8" : "border-tk-border"
									}`}
								>
									<div className="mb-1 flex items-baseline gap-2">
										<span
											className={`font-display font-extrabold tracking-[-0.03em] ${
												plan.unit ? "text-[2rem]" : "text-[1.625rem]"
											} ${plan.featured ? "text-tk-primary-bright" : "text-tk-ink"}`}
										>
											{plan.price}
										</span>
										{plan.unit && (
											<span
												className={`font-body text-[0.8125rem] ${
													plan.featured
														? "text-tk-on-dark-soft"
														: "text-tk-ink-2"
												}`}
											>
												{plan.unit}
											</span>
										)}
									</div>
									{plan.admin_price && (
										<p
											className={`font-body text-[0.8125rem] ${
												plan.featured
													? "text-[oklch(0.55_0.02_264)]"
													: "text-tk-muted"
											}`}
										>
											{plan.admin_price}
										</p>
									)}
									<p
										className={`mt-1.5 font-body font-semibold text-[0.8125rem] ${
											plan.featured
												? "text-tk-primary-bright"
												: "text-tk-primary"
										}`}
									>
										{plan.min}
									</p>
								</div>

								<ul className="m-0 mb-8 flex flex-1 list-none flex-col gap-2.5 p-0">
									{plan.features.map((feature) => (
										<li
											key={feature}
											className={`flex items-start gap-2.5 font-body text-[0.9rem] ${
												plan.featured ? "text-tk-on-dark-soft" : "text-tk-ink-2"
											}`}
										>
											<span
												className={`mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
													plan.featured
														? "bg-[oklch(0.58_0.17_149/0.2)]"
														: "bg-[oklch(0.58_0.17_149/0.12)]"
												}`}
											>
												<svg
													width="10"
													height="10"
													viewBox="0 0 10 10"
													fill="none"
												>
													<path
														d="M2 5l2.5 2.5 3.5-4"
														stroke="var(--tk-accent-emerald)"
														strokeWidth="1.5"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											</span>
											{feature}
										</li>
									))}
								</ul>

								<Link
									href="/contact"
									className={`flex items-center justify-center rounded-[0.625rem] px-6 py-3 font-body font-semibold text-[0.9375rem] no-underline transition-all duration-200 ${
										plan.featured
											? "border-none bg-tk-primary text-white hover:bg-tk-primary-deep"
											: "border-[1.5px] border-tk-primary bg-transparent text-tk-primary hover:bg-tk-primary-soft"
									}`}
								>
									{plan.cta}
								</Link>
							</div>
						</AnimateIn>
					))}
				</div>
			</div>
		</section>
	);
}
