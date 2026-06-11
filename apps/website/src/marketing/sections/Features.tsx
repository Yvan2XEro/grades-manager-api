"use client";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";
import { Showcase } from "../Showcase";

interface FeaturesProps {
	dict: Dict;
}

const accent: Record<string, string> = {
	primary: "text-tk-primary",
	emerald: "text-tk-accent-emerald",
	gold: "text-tk-accent-gold",
	bright: "text-tk-primary-bright",
};

const featureIcons = [
	<svg key="lmd" width="26" height="26" viewBox="0 0 28 28" fill="none">
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
	<svg key="rules" width="26" height="26" viewBox="0 0 28 28" fill="none">
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
	<svg key="hier" width="26" height="26" viewBox="0 0 28 28" fill="none">
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
	<svg key="diplo" width="26" height="26" viewBox="0 0 28 28" fill="none">
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
		<section id="features" className="bg-tk-surface">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<Rule />
				<div className="grid grid-cols-1 gap-x-12 gap-y-12 py-16 lg:grid-cols-12 lg:py-24">
					<div className="lg:col-span-4">
						<div className="lg:sticky lg:top-28">
							<SectionLabel number="03">Différenciateurs</SectionLabel>
							<SectionHeading className="mt-6">
								{d.features.title}
							</SectionHeading>
							<Lede className="mt-5">{d.features.sub}</Lede>
						</div>
					</div>

					<div className="lg:col-span-8">
						<div className="grid grid-cols-1 sm:grid-cols-2">
							{d.features.items.map((item, i) => (
								<AnimateIn key={i} delay={i * 80}>
									<div
										className={`h-full border-tk-border border-t p-7 sm:p-8 ${
											i % 2 === 1 ? "sm:border-l" : ""
										}`}
									>
										<div className="flex items-center justify-between">
											<span
												className={`${accent[item.color] ?? "text-tk-primary"}`}
											>
												{featureIcons[i]}
											</span>
											<span className="font-code text-[0.7rem] text-tk-muted tabular-nums">
												{String(i + 1).padStart(2, "0")}
											</span>
										</div>
										<span className="mt-5 inline-block font-code font-semibold text-[0.7rem] text-tk-primary uppercase tracking-[0.1em]">
											{item.tag}
										</span>
										<h3 className="mt-2 font-bold font-display text-lg text-tk-ink tracking-[-0.02em]">
											{item.title}
										</h3>
										<p className="mt-2.5 font-body text-[0.9rem] text-tk-ink-2 leading-[1.7]">
											{item.desc}
										</p>
									</div>
								</AnimateIn>
							))}
						</div>

						<AnimateIn mode="scale" delay={120}>
							<div className="mt-10">
								<Showcase
									variant="browser"
									url="app.tkams.com/regles"
									width={1800}
									height={1080}
									alt="Moteur de règles de délibération TKAMS"
									label="Capture d'un différenciateur clé — moteur de règles / délibération automatique"
									caption="public/screenshots/feature-rules.png · 1800 × 1080 px"
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
