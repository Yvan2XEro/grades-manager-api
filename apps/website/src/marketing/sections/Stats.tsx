import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Rule } from "../Editorial";

interface StatsProps {
	dict: Dict;
}

const stats = (d: Dict) => [
	{ value: "35+", label: d.stats.modules, sub: d.stats.modules_sub },
	{ value: "24", label: d.stats.exports, sub: d.stats.exports_sub },
	{ value: "7", label: d.stats.roles, sub: d.stats.roles_sub },
	{ value: "2", label: d.stats.languages, sub: d.stats.languages_sub },
];

export function Stats({ dict: d }: StatsProps) {
	return (
		<section className="bg-tk-surface">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<Rule />
				<div className="grid grid-cols-2 lg:grid-cols-4">
					{stats(d).map((stat, i) => (
						<AnimateIn key={stat.label} delay={i * 80}>
							<div
								className={`py-10 lg:py-12 ${
									i % 2 === 1 ? "border-tk-border border-l pl-6" : "pr-6"
								} ${i >= 2 ? "border-tk-border border-t" : ""} lg:border-t-0 lg:border-l lg:pl-8 ${
									i === 0 ? "lg:border-l-0 lg:pl-0" : ""
								}`}
							>
								<p className="font-display font-extrabold text-[clamp(2.25rem,4vw,3.25rem)] text-tk-ink leading-none tracking-[-0.04em]">
									{stat.value}
								</p>
								<p className="mt-3 font-body font-semibold text-[0.9375rem] text-tk-ink">
									{stat.label}
								</p>
								<p className="mt-1 font-body text-[0.8125rem] text-tk-muted leading-snug">
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
