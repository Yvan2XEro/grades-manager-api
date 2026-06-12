import { Quote } from "lucide-react";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";

export function Testimonials({
	data,
	number = "01",
	bg = "bg-tk-bg",
	count = 3,
}: {
	data: Dict["blocks"]["testimonials"];
	number?: string;
	bg?: string;
	count?: number;
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

					<div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: count }, (_, i) => (
							<AnimateIn key={i} delay={i * 80}>
								<div className="flex h-full flex-col rounded-2xl border border-tk-border-strong border-dashed bg-tk-surface/60 p-7">
									<Quote
										size={26}
										className="text-tk-border-strong"
										strokeWidth={1.5}
									/>
									<p className="mt-4 flex-1 font-body text-[0.95rem] text-tk-muted italic leading-[1.7]">
										“{data.placeholder}…”
									</p>
									<div className="mt-6 flex items-center gap-3">
										<span className="h-9 w-9 rounded-full border border-tk-border-strong border-dashed bg-tk-bg-deep" />
										<span className="flex flex-col gap-1">
											<span className="h-2 w-24 rounded-full bg-tk-border-strong" />
											<span className="h-2 w-16 rounded-full bg-tk-border" />
										</span>
									</div>
								</div>
							</AnimateIn>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
