import { Award, BadgeCheck, Languages, Lock, Tag, Users } from "lucide-react";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";

const ICONS = [BadgeCheck, Users, Languages, Lock, Award, Tag];

export function Reassurance({
	data,
	number = "01",
	bg = "bg-tk-surface",
}: {
	data: Dict["blocks"]["reassurance"];
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

					<div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{data.items.map((item, i) => {
							const Icon = ICONS[i % ICONS.length];
							return (
								<AnimateIn key={item.title} delay={i * 70}>
									<div className="h-full rounded-2xl border border-tk-border bg-tk-bg p-7">
										<span className="flex h-11 w-11 items-center justify-center rounded-xl border border-tk-border bg-tk-surface text-tk-primary">
											<Icon size={20} strokeWidth={1.7} />
										</span>
										<h3 className="mt-5 font-bold font-display text-[1.0625rem] text-tk-ink tracking-[-0.02em]">
											{item.title}
										</h3>
										<p className="mt-2 font-body text-[0.9rem] text-tk-ink-2 leading-[1.65]">
											{item.desc}
										</p>
									</div>
								</AnimateIn>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
