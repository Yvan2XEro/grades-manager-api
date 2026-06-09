"use client";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";

interface FeaturesProps {
	dict: Dict;
}

const colorMap = {
	primary: {
		tag: "oklch(0.48 0.2 277 / 0.2)",
		tagText: "var(--tk-primary-bright)",
		border: "oklch(0.48 0.2 277 / 0.3)",
		glow: "oklch(0.48 0.2 277 / 0.12)",
		icon: "var(--tk-primary)",
	},
	emerald: {
		tag: "oklch(0.58 0.17 149 / 0.15)",
		tagText: "var(--tk-accent-emerald)",
		border: "oklch(0.58 0.17 149 / 0.25)",
		glow: "oklch(0.58 0.17 149 / 0.08)",
		icon: "var(--tk-accent-emerald)",
	},
	gold: {
		tag: "oklch(0.72 0.16 86 / 0.15)",
		tagText: "var(--tk-accent-gold)",
		border: "oklch(0.72 0.16 86 / 0.25)",
		glow: "oklch(0.72 0.16 86 / 0.08)",
		icon: "var(--tk-accent-gold)",
	},
	bright: {
		tag: "oklch(0.65 0.22 277 / 0.15)",
		tagText: "var(--tk-primary-bright)",
		border: "oklch(0.65 0.22 277 / 0.25)",
		glow: "oklch(0.65 0.22 277 / 0.1)",
		icon: "var(--tk-primary-bright)",
	},
};

const featureIcons = [
	<svg key="lmd" width="28" height="28" viewBox="0 0 28 28" fill="none">
		<rect
			x="2"
			y="2"
			width="24"
			height="24"
			rx="6"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<path
			d="M8 14h12M8 9h8M8 19h6"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
	<svg key="rules" width="28" height="28" viewBox="0 0 28 28" fill="none">
		<path
			d="M14 3L25 8.5v11L14 25 3 19.5v-11L14 3z"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<path
			d="M14 10v8M10 14h8"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
	<svg key="hier" width="28" height="28" viewBox="0 0 28 28" fill="none">
		<circle cx="14" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
		<circle cx="7" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
		<circle cx="21" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
		<path
			d="M14 9v4M14 13L7 16M14 13l7 3"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
	<svg key="diplo" width="28" height="28" viewBox="0 0 28 28" fill="none">
		<rect
			x="4"
			y="6"
			width="20"
			height="16"
			rx="3"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<path
			d="M9 13h10M9 17h6"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<circle cx="20" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
	</svg>,
];

export function Features({ dict: d }: FeaturesProps) {
	return (
		<section
			id="features"
			className="relative overflow-hidden bg-tk-dark px-6 py-24"
		>
			<div className="tk-grid-pattern absolute inset-0 z-0" />

			<div className="relative z-[1] mx-auto max-w-7xl">
				<AnimateIn>
					<div className="mb-14 text-center">
						<span className="mb-5 inline-block rounded-full border border-[oklch(0.48_0.2_277/0.25)] bg-[oklch(0.48_0.2_277/0.12)] px-3.5 py-[0.3125rem] font-code font-semibold text-[0.8125rem] text-tk-primary-bright tracking-[0.05em]">
							DIFFÉRENCIATEURS
						</span>
						<h2 className="mb-3 font-display font-extrabold text-[clamp(1.875rem,4vw,2.75rem)] text-tk-on-dark tracking-[-0.04em]">
							{d.features.title}
						</h2>
						<p className="font-body text-[1.0625rem] text-tk-on-dark-soft">
							{d.features.sub}
						</p>
					</div>
				</AnimateIn>

				<div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
					{d.features.items.map((item, i) => {
						const colors =
							colorMap[item.color as keyof typeof colorMap] || colorMap.primary;
						return (
							<AnimateIn key={i} delay={i * 80}>
								<div
									className="hover:-translate-y-1 relative h-full overflow-hidden rounded-[1.25rem] bg-tk-dark-2 p-8 transition-all duration-200"
									style={{ border: `1px solid ${colors.border}` }}
									onMouseEnter={(e) => {
										e.currentTarget.style.boxShadow = `0 20px 60px ${colors.glow}`;
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.boxShadow = "none";
									}}
								>
									<div
										className="pointer-events-none absolute top-0 right-0 h-[180px] w-[180px]"
										style={{
											background: `radial-gradient(ellipse at top right, ${colors.glow}, transparent)`,
										}}
									/>

									<div
										className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[0.875rem]"
										style={{
											background: colors.tag,
											border: `1px solid ${colors.border}`,
											color: colors.icon,
										}}
									>
										{featureIcons[i]}
									</div>

									<span
										className="mb-3.5 inline-block rounded-full px-2.5 py-[0.1875rem] font-bold font-code text-[0.75rem] tracking-[0.05em]"
										style={{ background: colors.tag, color: colors.tagText }}
									>
										{item.tag}
									</span>

									<h3 className="mb-3 font-bold font-display text-lg text-tk-on-dark tracking-[-0.02em]">
										{item.title}
									</h3>

									<p className="font-body text-[0.9rem] text-tk-on-dark-soft leading-[1.7]">
										{item.desc}
									</p>
								</div>
							</AnimateIn>
						);
					})}
				</div>
			</div>
		</section>
	);
}
