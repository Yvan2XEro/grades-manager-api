"use client";
import Link from "next/link";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";

interface PricingProps {
	dict: Dict;
	number?: string;
}

export function Pricing({ dict: d, number = "06" }: PricingProps) {
	return (
		<section id="pricing" className="bg-tk-bg">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<Rule />
				<div className="py-16 lg:py-24">
					<div className="max-w-2xl">
						<SectionLabel number={number}>Tarification</SectionLabel>
						<SectionHeading className="mt-6">{d.pricing.title}</SectionHeading>
						<Lede className="mt-5">{d.pricing.sub}</Lede>
					</div>

					<div className="mt-14 grid grid-cols-1 items-stretch gap-px overflow-hidden rounded-2xl border border-tk-border bg-tk-border md:grid-cols-2 lg:grid-cols-3">
						{d.pricing.plans.map((plan, i) => (
							<AnimateIn key={plan.name} delay={i * 90}>
								<div
									className={`relative flex h-full flex-col p-8 ${
										plan.featured ? "bg-tk-dark" : "bg-tk-surface"
									}`}
								>
									{plan.featured && (
										<div className="absolute top-0 right-0 left-0 h-[3px] bg-tk-primary" />
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
												<span className="rounded-full bg-tk-primary px-3 py-1 font-bold font-code text-[0.7rem] text-white uppercase tracking-[0.05em]">
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
											plan.featured ? "border-white/10" : "border-tk-border"
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
														? "text-tk-on-dark-soft"
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
													plan.featured
														? "text-tk-on-dark-soft"
														: "text-tk-ink-2"
												}`}
											>
												<span className="mt-[3px] text-tk-accent-emerald">
													<svg
														width="12"
														height="12"
														viewBox="0 0 10 10"
														fill="none"
													>
														<path
															d="M2 5l2.5 2.5 3.5-4"
															stroke="currentColor"
															strokeWidth="1.6"
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
												? "bg-tk-primary text-white hover:bg-tk-primary-deep"
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
			</div>
		</section>
	);
}
