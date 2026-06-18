import Link from "next/link";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Rule, SectionLabel } from "../Editorial";

interface CtaProps {
	dict: Dict;
	number?: string;
}

export function Cta({ dict: d, number = "10" }: CtaProps) {
	return (
		<section className="relative overflow-hidden bg-tk-dark text-tk-on-dark">
			<div className="tk-grid-pattern pointer-events-none absolute inset-0 opacity-60" />
			<div className="relative z-[1] mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="h-px w-full bg-white/12" />
				<div className="py-20 lg:py-28">
					<SectionLabel number={number} theme="dark">
						Démarrer
					</SectionLabel>

					<div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
						<div className="lg:col-span-8">
							<AnimateIn>
								<h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.75rem)] text-tk-on-dark leading-[1.05] tracking-[-0.04em]">
									{d.cta.title}
								</h2>
							</AnimateIn>
						</div>
						<div className="flex flex-col justify-end gap-7 lg:col-span-4">
							<AnimateIn delay={100}>
								<p className="max-w-[44ch] font-body text-[1.0625rem] text-tk-on-dark-soft leading-[1.7]">
									{d.cta.sub}
								</p>
							</AnimateIn>
							<AnimateIn delay={200}>
								<div className="flex flex-wrap gap-3.5">
									<Link href="/contact" className="tk-btn-primary">
										{d.cta.primary}
									</Link>
									<a
										href={`mailto:${d.cta.secondary}`}
										className="tk-btn-ghost"
									>
										{d.cta.secondary}
									</a>
								</div>
							</AnimateIn>
						</div>
					</div>

					<div className="mt-16">
						<Rule theme="dark" />
						<p className="mt-5 font-code text-[0.8125rem] text-tk-on-dark-muted">
							<a
								href="https://www.overbrand.net/"
								target="_blank"
								rel="noopener noreferrer"
								className="no-underline transition-colors duration-150 hover:text-tk-on-dark"
							>
								OverBrand
							</a>
							{" · Douala · Yaoundé · contact@tkams.com"}
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
