import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";

interface StatsProps {
	dict: Dict;
}

const stats = (d: Dict) => [
	{
		value: "35+",
		label: d.stats.modules,
		sub: d.stats.modules_sub,
		color: "var(--tk-primary)",
	},
	{
		value: "24",
		label: d.stats.exports,
		sub: d.stats.exports_sub,
		color: "var(--tk-accent-emerald)",
	},
	{
		value: "7",
		label: d.stats.roles,
		sub: d.stats.roles_sub,
		color: "var(--tk-accent-gold)",
	},
	{
		value: "2",
		label: d.stats.languages,
		sub: d.stats.languages_sub,
		color: "var(--tk-accent-blue)",
	},
];

export function Stats({ dict: d }: StatsProps) {
	return (
		<section className="border-white/6 border-t border-b bg-tk-dark-2 px-6 py-14">
			<div className="mx-auto max-w-7xl">
				<AnimateIn mode="fade">
					<p className="mb-10 text-center font-code font-semibold text-[0.8125rem] text-[oklch(0.45_0.02_264)] uppercase tracking-[0.1em]">
						{d.stats.title}
					</p>
				</AnimateIn>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-px overflow-hidden rounded-2xl bg-white/6">
					{stats(d).map((stat, i) => (
						<AnimateIn key={stat.label} delay={i * 80}>
							<div className="relative overflow-hidden bg-tk-dark-2 px-6 py-8 text-center">
								<div
									className="-translate-x-1/2 absolute bottom-0 left-1/2 h-[2px] w-[60%] rounded-t-sm opacity-70"
									style={{ background: stat.color }}
								/>
								<p
									className="mb-2 font-display font-extrabold text-[clamp(2rem,4vw,3rem)] leading-none tracking-[-0.03em]"
									style={{ color: stat.color }}
								>
									{stat.value}
								</p>
								<p className="mb-1 font-body font-semibold text-[0.9375rem] text-tk-on-dark">
									{stat.label}
								</p>
								<p className="font-body text-[0.8125rem] text-[oklch(0.45_0.02_264)]">
									{stat.sub}
								</p>
							</div>
						</AnimateIn>
					))}
				</div>
			</div>
		</section>
	);
}
