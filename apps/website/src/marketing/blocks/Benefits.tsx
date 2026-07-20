import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";

export function Benefits({
	data,
	number = "01",
	bg = "bg-tk-bg",
}: {
	data: Dict["blocks"]["benefits"];
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

					<div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{data.items.map((item, i) => (
							<AnimateIn key={item.label} delay={i * 80}>
								<div className="h-full rounded-2xl border border-tk-border bg-tk-surface p-7">
									<p className="font-display font-extrabold text-[clamp(2.25rem,4vw,3rem)] text-tk-primary leading-none tracking-[-0.04em]">
										{item.value}
									</p>
									<p className="mt-3 font-body font-semibold text-[0.9375rem] text-tk-ink">
										{item.label}
									</p>
									<p className="mt-1.5 font-body text-[0.85rem] text-tk-ink-2 leading-[1.55]">
										{item.desc}
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
