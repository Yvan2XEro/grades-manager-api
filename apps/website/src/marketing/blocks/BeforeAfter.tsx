import { Check, X } from "lucide-react";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";

export function BeforeAfter({
	data,
	number = "01",
	bg = "bg-tk-bg",
}: {
	data: Dict["blocks"]["beforeAfter"];
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

					<div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
						{/* Before */}
						<AnimateIn>
							<div className="h-full rounded-2xl border border-tk-border bg-tk-surface p-7 sm:p-8">
								<div className="mb-6 flex items-center gap-3">
									<span className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.65_0.2_25/0.12)] text-[oklch(0.55_0.2_25)]">
										<X size={18} strokeWidth={2.5} />
									</span>
									<h3 className="font-bold font-display text-[1.0625rem] text-tk-ink-soft tracking-[-0.02em]">
										{data.before.title}
									</h3>
								</div>
								<ul className="m-0 flex list-none flex-col gap-3 p-0">
									{data.before.items.map((item) => (
										<li
											key={item}
											className="flex items-start gap-3 font-body text-[0.9rem] text-tk-muted leading-[1.6]"
										>
											<X
												size={16}
												className="mt-0.5 shrink-0 text-[oklch(0.65_0.2_25/0.7)]"
											/>
											<span className="line-through decoration-tk-border-strong">
												{item}
											</span>
										</li>
									))}
								</ul>
							</div>
						</AnimateIn>

						{/* After */}
						<AnimateIn delay={120}>
							<div className="h-full rounded-2xl border-2 border-tk-primary/30 bg-tk-primary-soft/50 p-7 shadow-[0_18px_50px_oklch(0.48_0.2_277/0.1)] sm:p-8">
								<div className="mb-6 flex items-center gap-3">
									<span className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.58_0.17_149/0.16)] text-tk-accent-emerald">
										<Check size={18} strokeWidth={2.5} />
									</span>
									<h3 className="font-bold font-display text-[1.0625rem] text-tk-ink tracking-[-0.02em]">
										{data.after.title}
									</h3>
								</div>
								<ul className="m-0 flex list-none flex-col gap-3 p-0">
									{data.after.items.map((item) => (
										<li
											key={item}
											className="flex items-start gap-3 font-body font-medium text-[0.9rem] text-tk-ink leading-[1.6]"
										>
											<Check
												size={16}
												className="mt-0.5 shrink-0 text-tk-accent-emerald"
												strokeWidth={2.5}
											/>
											{item}
										</li>
									))}
								</ul>
							</div>
						</AnimateIn>
					</div>
				</div>
			</div>
		</section>
	);
}
