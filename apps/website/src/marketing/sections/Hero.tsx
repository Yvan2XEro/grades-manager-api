import Link from "next/link";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { DemoFrame } from "../demos/DemoFrame";
import { GradeEntryDemo } from "../demos/GradeEntryDemo";
import { Rule, SectionLabel } from "../Editorial";
import { MotifBand, MotifChevron, MotifLayer, MotifWeave } from "../Motifs";

interface HeroProps {
	dict: Dict;
}

export function Hero({ dict: d }: HeroProps) {
	return (
		<section className="tk-grain relative overflow-hidden bg-tk-bg pt-[68px]">
			{/*
			 * Three background layers, all decorative:
			 *   1. two very soft warm halos, which give the flat page some depth
			 *   2. the woven watermark, fading out before it reaches body copy
			 *   3. paper grain, applied by `tk-grain` on the section itself
			 */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 overflow-hidden"
			>
				<div className="-top-40 -left-32 absolute h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,var(--tk-accent-soft),transparent_68%)] opacity-70" />
				<div className="-right-40 absolute top-24 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,var(--tk-primary-soft),transparent_68%)] opacity-80" />
			</div>
			<MotifLayer
				fade="top"
				className="h-[620px] text-tk-accent opacity-[0.16]"
			>
				<MotifWeave scale={56} />
			</MotifLayer>
			{/* A denser woven column anchoring the right edge behind the copy. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-0 right-0 hidden h-[620px] w-[38%] text-tk-accent opacity-[0.2] [mask-image:radial-gradient(ellipse_at_top_right,#000,transparent_70%)] lg:block"
			>
				<MotifChevron scale={26} />
			</div>

			<div className="relative mx-auto max-w-[86rem] px-6 lg:px-10">
				{/* Masthead line */}
				<div className="flex items-center justify-between gap-4 py-5">
					<SectionLabel number="01">{d.hero.kicker}</SectionLabel>
					<span className="hidden font-code text-[0.7rem] text-tk-muted uppercase tracking-[0.12em] sm:inline">
						{d.hero.cities}
					</span>
				</div>
				<Rule />

				{/* Headline block */}
				<div className="grid grid-cols-1 gap-x-12 gap-y-10 pt-12 pb-14 lg:grid-cols-12 lg:pt-20">
					<div className="lg:col-span-8">
						<AnimateIn>
							<h1 className="font-display font-extrabold text-[clamp(2.375rem,1.35rem+4.3vw,4.25rem)] text-tk-ink leading-[1.04] tracking-[-0.038em] [overflow-wrap:break-word]">
								{d.hero.headline_1}{" "}
								<span className="text-tk-accent">{d.hero.headline_2}</span>
							</h1>
						</AnimateIn>
					</div>
					<div className="flex flex-col justify-end gap-7 lg:col-span-4">
						<AnimateIn delay={90}>
							<p className="max-w-[44ch] font-body text-[1.0625rem] text-tk-ink-2 leading-[1.7]">
								{d.hero.sub}
							</p>
						</AnimateIn>
						<AnimateIn delay={180}>
							<div className="flex flex-wrap gap-3.5">
								<Link href="/contact" className="tk-btn-primary">
									{d.hero.cta_primary}
								</Link>
								<a href="#ressources" className="tk-btn-outline">
									{d.hero.cta_secondary}
								</a>
							</div>
						</AnimateIn>
					</div>
				</div>
			</div>

			{/* Live interactive product demo */}
			<div className="relative mx-auto max-w-[64rem] px-6 lg:px-10">
				<AnimateIn mode="scale" delay={240}>
					<DemoFrame url="app.tkams.com/saisie" caption={d.demos.caption_grade}>
						<GradeEntryDemo t={d.demos.grade} />
					</DemoFrame>
				</AnimateIn>
			</div>

			{/* Trust row */}
			<div className="relative mx-auto mt-12 max-w-[86rem] px-6 lg:px-10">
				<Rule />
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-5">
					{[d.hero.badge_lmd, d.hero.badge_bi, d.hero.badge_live].map(
						(badge) => (
							<span
								key={badge}
								className="inline-flex items-center gap-2 font-body font-medium text-[0.875rem] text-tk-ink-soft"
							>
								<span className="h-1.5 w-1.5 rounded-full bg-tk-accent" />
								{badge}
							</span>
						),
					)}
				</div>
			</div>

			{/* Woven selvedge closing the chapter */}
			<MotifBand className="mt-2" />
		</section>
	);
}
