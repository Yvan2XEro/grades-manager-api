import { Quote } from "lucide-react";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";

function initials(name: string): string {
	return name
		.replace(/(Dr\.|Pr\.|Prof\.|Mme|M\.)\s*/g, "")
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? "")
		.join("");
}

export function Testimonials({
	data,
	number = "01",
	bg = "bg-tk-bg",
}: {
	data: Dict["blocks"]["testimonials"];
	number?: string;
	bg?: string;
}) {
	const items = data.items ?? [];

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

					<div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
						{items.map((item, i) => (
							<AnimateIn key={item.name} delay={i * 80}>
								<figure className="flex h-full flex-col rounded-2xl border border-tk-border bg-tk-surface p-7 lg:p-8">
									<Quote
										size={28}
										className="text-tk-primary/35"
										strokeWidth={1.5}
									/>
									<blockquote className="mt-4 flex-1 font-body text-[1.0625rem] text-tk-ink-2 leading-[1.7]">
										“{item.quote}”
									</blockquote>
									<figcaption className="mt-7 flex items-center gap-3.5 border-tk-border border-t pt-6">
										<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tk-primary-soft font-code font-semibold text-[0.8rem] text-tk-primary">
											{initials(item.name)}
										</span>
										<span className="flex flex-col">
											<span className="font-body font-semibold text-[0.9375rem] text-tk-ink">
												{item.name}
											</span>
											<span className="font-body text-[0.8125rem] text-tk-muted">
												{item.role} · {item.org}
											</span>
										</span>
									</figcaption>
								</figure>
							</AnimateIn>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
