import Link from "next/link";
import type { Dict } from "@/i18n";
import { DemoFrame } from "../demos/DemoFrame";
import { GradeEntryDemo } from "../demos/GradeEntryDemo";
import { Rule, SectionLabel } from "../Editorial";

interface HeroProps {
	dict: Dict;
}

export function Hero({ dict: d }: HeroProps) {
	return (
		<section className="relative overflow-hidden bg-tk-bg pt-[68px]">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				{/* Masthead line */}
				<div className="flex items-center justify-between gap-4 py-5">
					<SectionLabel number="01">
						{d.hero.kicker.replace(/^★\s*/, "")}
					</SectionLabel>
					<span className="hidden font-code text-[0.7rem] text-tk-muted uppercase tracking-[0.12em] sm:inline">
						Douala · Yaoundé
					</span>
				</div>
				<Rule />

				{/* Headline block */}
				<div className="grid grid-cols-1 gap-x-12 gap-y-10 pt-12 pb-14 lg:grid-cols-12 lg:pt-20">
					<div className="lg:col-span-8">
						<h1 className="font-display font-extrabold text-[clamp(2.5rem,6.5vw,4.75rem)] text-tk-ink leading-[1.02] tracking-[-0.045em]">
							{d.hero.headline_1}{" "}
							<span className="text-tk-primary italic">
								{d.hero.headline_2}
							</span>
						</h1>
					</div>
					<div className="flex flex-col justify-end gap-7 lg:col-span-4">
						<p className="max-w-[44ch] font-body text-[1.0625rem] text-tk-ink-2 leading-[1.7]">
							{d.hero.sub}
						</p>
						<div className="flex flex-wrap gap-3.5">
							<Link href="/contact" className="tk-btn-primary">
								{d.hero.cta_primary}
							</Link>
							<a href="#ressources" className="tk-btn-outline">
								{d.hero.cta_secondary}
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* Live interactive product demo */}
			<div className="mx-auto max-w-[64rem] px-6 lg:px-10">
				<DemoFrame
					url="app.tkams.com/saisie"
					caption="Démo en direct · modifie une note, la moyenne et la décision se recalculent"
				>
					<GradeEntryDemo />
				</DemoFrame>
			</div>

			{/* Trust row */}
			<div className="mx-auto mt-12 max-w-[86rem] px-6 lg:px-10">
				<Rule />
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-5">
					{[d.hero.badge_lmd, d.hero.badge_bi, d.hero.badge_live].map(
						(badge) => (
							<span
								key={badge}
								className="inline-flex items-center gap-2 font-body font-medium text-[0.875rem] text-tk-ink-soft"
							>
								<span className="h-1.5 w-1.5 rounded-full bg-tk-accent-emerald" />
								{badge}
							</span>
						),
					)}
				</div>
			</div>
		</section>
	);
}
