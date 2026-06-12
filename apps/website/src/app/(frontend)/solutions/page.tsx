import { Building2, Check, Gavel, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { getDict, getLocale } from "@/i18n";
import { BeforeAfter } from "@/marketing/blocks/BeforeAfter";
import { Testimonials } from "@/marketing/blocks/Testimonials";
import {
	Lede,
	Rule,
	SectionHeading,
	SectionLabel,
} from "@/marketing/Editorial";
import { Cta } from "@/marketing/sections/Cta";

const ICONS = [GraduationCap, Gavel, Building2];

export default async function SolutionsPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const s = dict.solutions;

	return (
		<main className="bg-tk-bg pt-[68px]">
			{/* Masthead */}
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="pt-12 pb-12 lg:pt-16">
					<SectionLabel number="✶">{s.label}</SectionLabel>
					<SectionHeading as="h1" className="mt-6 max-w-4xl">
						{s.title}
					</SectionHeading>
					<Lede className="mt-5 max-w-[52ch]">{s.sub}</Lede>
				</div>
			</div>

			<BeforeAfter
				data={dict.blocks.beforeAfter}
				number="01"
				bg="bg-tk-surface"
			/>

			{s.roles.map((role, i) => {
				const Icon = ICONS[i % ICONS.length];
				const flipped = i % 2 === 1;
				const num = String(i + 2).padStart(2, "0");
				return (
					<section
						key={role.role}
						className={flipped ? "bg-tk-surface" : "bg-tk-bg"}
					>
						<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
							<Rule />
							<div className="grid grid-cols-1 gap-x-12 gap-y-10 py-16 lg:grid-cols-12 lg:py-24">
								{/* Copy */}
								<div className={`lg:col-span-6 ${flipped ? "lg:order-2" : ""}`}>
									<SectionLabel number={num}>{role.role}</SectionLabel>
									<p className="mt-6 font-body text-[0.9rem] text-tk-muted italic">
										{role.pain}
									</p>
									<SectionHeading className="mt-2 text-[clamp(1.5rem,2.6vw,2.25rem)]">
										{role.title}
									</SectionHeading>
									<Lede className="mt-4">{role.desc}</Lede>
									<ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
										{role.points.map((point) => (
											<li
												key={point}
												className="flex items-start gap-3 font-body text-[0.9rem] text-tk-ink-2"
											>
												<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[oklch(0.58_0.17_149/0.14)] text-tk-accent-emerald">
													<Check size={12} strokeWidth={2.5} />
												</span>
												{point}
											</li>
										))}
									</ul>
								</div>

								{/* Persona panel */}
								<div className={`lg:col-span-6 ${flipped ? "lg:order-1" : ""}`}>
									<div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-tk-dark p-8 text-tk-on-dark sm:p-10">
										<div className="tk-grid-pattern pointer-events-none absolute inset-0 opacity-50" />
										<div
											className="pointer-events-none absolute top-[-10%] right-[-10%] h-[260px] w-[260px]"
											style={{
												background:
													"radial-gradient(ellipse at center, oklch(0.48 0.2 277 / 0.2) 0%, transparent 70%)",
											}}
										/>
										<div className="relative z-[1] flex h-full flex-col">
											<span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[oklch(0.48_0.2_277/0.3)] bg-[oklch(0.48_0.2_277/0.15)] text-tk-primary-bright">
												<Icon size={24} strokeWidth={1.7} />
											</span>
											<p className="mt-6 font-code text-[0.7rem] text-tk-on-dark-muted uppercase tracking-[0.14em]">
												{role.role}
											</p>
											<p className="mt-3 font-display font-extrabold text-[clamp(1.375rem,2vw,1.75rem)] text-tk-on-dark leading-[1.2] tracking-[-0.02em]">
												{role.outcome}
											</p>
											<div className="mt-auto flex flex-wrap gap-2 pt-8">
												{role.wins.map((win) => (
													<span
														key={win}
														className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 font-body font-medium text-[0.8125rem] text-tk-on-dark-soft"
													>
														<span className="h-1.5 w-1.5 rounded-full bg-tk-accent-emerald" />
														{win}
													</span>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>
				);
			})}

			<Testimonials
				data={dict.blocks.testimonials}
				number="05"
				bg="bg-tk-surface"
			/>
			<Cta dict={dict} number="06" />
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const s = getDict(locale).solutions;
	return { title: `${s.title} — TKAMS`, description: s.sub };
}
