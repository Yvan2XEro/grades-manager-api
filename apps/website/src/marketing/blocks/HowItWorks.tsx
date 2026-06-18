import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";

export function HowItWorks({
	data,
	number = "01",
	bg = "bg-tk-surface",
}: {
	data: Dict["blocks"]["howItWorks"];
	number?: string;
	bg?: string;
}) {
	return (
		<section className={bg}>
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<Rule />
				<div className="py-16 lg:py-24">
					<div className="max-w-2xl">
						<SectionLabel number={number}>{data.label}</SectionLabel>
						<SectionHeading className="mt-6">{data.title}</SectionHeading>
						<Lede className="mt-5">{data.sub}</Lede>
					</div>

					<div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
						{data.steps.map((step, i) => (
							<AnimateIn key={step.title} delay={i * 90}>
								<div className="relative">
									<div className="flex items-center gap-3">
										<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tk-primary font-display font-extrabold text-[1.0625rem] text-white tabular-nums">
											{i + 1}
										</span>
										<span className="h-px flex-1 bg-tk-border" />
									</div>
									<h3 className="mt-5 font-bold font-display text-lg text-tk-ink tracking-[-0.02em]">
										{step.title}
									</h3>
									<p className="mt-2 font-body text-[0.9rem] text-tk-ink-2 leading-[1.65]">
										{step.desc}
									</p>
								</div>
							</AnimateIn>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
