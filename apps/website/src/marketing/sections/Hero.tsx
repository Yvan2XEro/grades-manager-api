import Link from "next/link";
import type { Dict } from "@/i18n";

interface HeroProps {
	dict: Dict;
}

export function Hero({ dict: d }: HeroProps) {
	return (
		<section className="relative flex min-h-screen items-center overflow-hidden bg-tk-dark pt-[68px]">
			<div className="tk-grid-pattern absolute inset-0 z-0" />

			{/* Main radial glow */}
			<div
				className="-translate-x-1/2 pointer-events-none absolute top-[10%] left-1/2 z-[1] h-[500px] w-[900px]"
				style={{
					background:
						"radial-gradient(ellipse at center, oklch(0.48 0.2 277 / 0.18) 0%, transparent 70%)",
				}}
			/>

			{/* Side accent glow */}
			<div
				className="pointer-events-none absolute top-[30%] right-[5%] z-[1] h-[350px] w-[350px]"
				style={{
					background:
						"radial-gradient(ellipse at center, oklch(0.58 0.17 149 / 0.08) 0%, transparent 70%)",
				}}
			/>

			<div className="relative z-[2] mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 py-20 pb-16 lg:grid-cols-2">
				{/* Left: copy */}
				<div>
					<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[oklch(0.48_0.2_277/0.3)] bg-[oklch(0.48_0.2_277/0.15)] px-3.5 py-1.5">
						<span className="font-body font-medium text-[0.8125rem] text-tk-primary-bright">
							{d.hero.kicker}
						</span>
					</div>

					<h1 className="mb-6 font-display font-extrabold text-[clamp(2.25rem,5vw,3.5rem)] text-tk-on-dark leading-[1.1] tracking-[-0.04em]">
						{d.hero.headline_1}{" "}
						<span className="relative inline-block text-tk-primary-bright">
							{d.hero.headline_2}
							<span className="absolute right-0 bottom-[-4px] left-0 h-[3px] rounded-sm bg-[linear-gradient(90deg,var(--tk-primary-bright),transparent)]" />
						</span>
					</h1>

					<p className="mb-10 max-w-[36rem] font-body text-[1.0625rem] text-tk-on-dark-soft leading-[1.7]">
						{d.hero.sub}
					</p>

					<div className="mb-10 flex flex-wrap gap-3.5">
						<Link href="/contact" className="tk-btn-primary">
							{d.hero.cta_primary}
						</Link>
						<a href="#modules" className="tk-btn-ghost">
							{d.hero.cta_secondary}
						</a>
					</div>

					<div className="flex flex-wrap gap-3">
						{[d.hero.badge_lmd, d.hero.badge_bi, d.hero.badge_live].map(
							(badge) => (
								<span
									key={badge}
									className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-[0.3125rem] font-body font-medium text-[0.8125rem] text-tk-on-dark-soft"
								>
									<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-tk-accent-emerald" />
									{badge}
								</span>
							),
						)}
					</div>
				</div>

				{/* Right: UI mockup */}
				<div className="relative hidden lg:block">
					<div className="tk-float mx-auto max-w-[420px] rounded-[1.25rem] border border-white/10 bg-[oklch(0.18_0.04_264)] p-6 shadow-[0_32px_80px_oklch(0_0_0/0.5),0_0_0_1px_oklch(1_0_0/0.05)]">
						{/* Window chrome */}
						<div className="mb-5 flex items-center gap-2 border-white/8 border-b pb-4">
							<div className="flex gap-1.5">
								{[
									"oklch(0.7 0.18 25)",
									"oklch(0.75 0.16 86)",
									"oklch(0.6 0.17 149)",
								].map((c, i) => (
									<div
										key={i}
										className="h-2.5 w-2.5 rounded-full"
										style={{ background: c }}
									/>
								))}
							</div>
							<span className="ml-1.5 font-code text-[0.75rem] text-[oklch(0.45_0.02_264)]">
								TKAMS · Délibérations
							</span>
						</div>

						{/* Progress bar */}
						<div className="mb-4">
							<div className="mb-2 flex justify-between">
								<span className="font-body text-[0.8rem] text-tk-on-dark-soft">
									Licence 3 · Informatique
								</span>
								<span className="rounded-full border border-[oklch(0.58_0.17_149/0.3)] bg-[oklch(0.58_0.17_149/0.15)] px-2.5 py-[0.1875rem] font-code font-semibold text-[0.75rem] text-tk-accent-emerald">
									En cours
								</span>
							</div>
							<div className="h-1.5 overflow-hidden rounded-full bg-white/8">
								<div className="h-full w-[67%] rounded-full bg-[linear-gradient(90deg,var(--tk-primary),var(--tk-primary-bright))]" />
							</div>
							<div className="mt-1 flex justify-between">
								<span className="font-code text-[0.75rem] text-[oklch(0.45_0.02_264)]">
									134 / 200 étudiants traités
								</span>
								<span className="font-code font-semibold text-[0.75rem] text-tk-primary-bright">
									67%
								</span>
							</div>
						</div>

						{/* Student rows */}
						{[
							{
								name: "MBARGA Jean",
								ue: "Algo",
								moy: "14.5",
								decision: "Admis",
								decisionClass: "text-tk-accent-emerald",
							},
							{
								name: "ATANGANA Rose",
								ue: "BD",
								moy: "11.0",
								decision: "Admis",
								decisionClass: "text-tk-accent-emerald",
							},
							{
								name: "BELLO Fatima",
								ue: "Réseau",
								moy: "7.5",
								decision: "Rattrapage",
								decisionClass: "text-tk-accent-gold",
							},
						].map((row, i) => (
							<div
								key={i}
								className="mb-1.5 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5"
							>
								<div>
									<p className="m-0 font-body font-medium text-[0.8125rem] text-tk-on-dark">
										{row.name}
									</p>
									<p className="m-0 font-code text-[0.75rem] text-[oklch(0.45_0.02_264)]">
										{row.ue}
									</p>
								</div>
								<div className="text-right">
									<p className="m-0 font-bold font-code text-[0.875rem] text-tk-on-dark">
										{row.moy}
									</p>
									<span
										className={`font-bold font-code text-[0.7rem] ${row.decisionClass}`}
									>
										{row.decision}
									</span>
								</div>
							</div>
						))}

						{/* CTA row */}
						<div className="mt-4 flex items-center justify-between rounded-[0.625rem] border border-[oklch(0.48_0.2_277/0.25)] bg-[oklch(0.48_0.2_277/0.12)] px-3 py-3">
							<span className="font-body font-medium text-[0.8125rem] text-tk-primary-bright">
								Générer PV de délibération
							</span>
							<span className="cursor-pointer rounded-md bg-tk-primary px-3 py-[0.3125rem] font-body font-semibold text-[0.75rem] text-white">
								Générer →
							</span>
						</div>
					</div>

					{/* Floating badge */}
					<div className="absolute top-[-1.5rem] right-[-1rem] rounded-xl border border-[oklch(0.58_0.17_149/0.3)] bg-[oklch(0.18_0.04_264)] px-4 py-3 shadow-[0_8px_24px_oklch(0_0_0/0.3)]">
						<p className="m-0 mb-1 font-code text-[0.7rem] text-[oklch(0.45_0.02_264)]">
							Délibérations
						</p>
						<p className="m-0 font-display font-extrabold text-[1.5rem] text-tk-accent-emerald">
							3h
						</p>
						<p className="m-0 mt-1 font-body text-[0.7rem] text-[oklch(0.55_0.014_264)]">
							vs 3 semaines avant
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
