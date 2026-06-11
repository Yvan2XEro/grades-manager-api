"use client";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";
import { Lede, Rule, SectionHeading, SectionLabel } from "../Editorial";

interface PainProps {
	dict: Dict;
}

const icons = [
	<svg key="0" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<path
			d="M13 3.5l3.5 3.5L7 17H3.5V13.5L13 3.5z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<path
			d="M11 5.5l3.5 3.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
	<svg key="1" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<rect
			x="3"
			y="3"
			width="14"
			height="14"
			rx="3"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<path
			d="M7 7l6 6M13 7l-6 6"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
	<svg key="2" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<path
			d="M10.5 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<circle cx="14.5" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
		<path
			d="M14.5 4.5V6l1 1"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M6 10h5M6 13h4"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
		/>
	</svg>,
	<svg key="3" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<rect
			x="6"
			y="5"
			width="10"
			height="13"
			rx="2"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<path
			d="M4 3h10a2 2 0 012 2"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M9 9h4M9 12h3"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
		/>
	</svg>,
	<svg key="4" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<path
			d="M3.5 3.5l13 13"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M6.5 6.8C4.5 8 3 10 3 10s2.5 5 7 5c1.3 0 2.5-.4 3.5-1"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M9 5.1C9.3 5 9.6 5 10 5c4.5 0 7 5 7 5s-.6 1.2-1.8 2.4"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
	<svg key="5" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<path
			d="M7.5 12.5L6 14a3.182 3.182 0 01-4.5-4.5l2-2a3.182 3.182 0 014.24 0"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M12.5 7.5L14 6a3.182 3.182 0 014.5 4.5l-2 2a3.182 3.182 0 01-4.24 0"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
];

export function Pain({ dict: d }: PainProps) {
	return (
		<section className="bg-tk-bg">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<Rule />
				<div className="grid grid-cols-1 gap-x-12 gap-y-12 py-16 lg:grid-cols-12 lg:py-24">
					<div className="lg:col-span-4">
						<div className="lg:sticky lg:top-28">
							<SectionLabel number="02">{d.pain.sub}</SectionLabel>
							<SectionHeading className="mt-6">
								{d.pain.title}{" "}
								<span className="text-tk-primary italic">{d.pain.title_2}</span>
							</SectionHeading>
							<Lede className="mt-5">{d.pain.sub}</Lede>
						</div>
					</div>

					<div className="lg:col-span-8">
						{d.pain.items.map((item, i) => (
							<AnimateIn key={i} delay={i * 60}>
								<div className="group flex items-start gap-5 border-tk-border border-t py-6 transition-colors duration-200 hover:bg-tk-surface/60">
									<span className="mt-0.5 w-6 shrink-0 font-code text-[0.7rem] text-tk-muted tabular-nums">
										{String(i + 1).padStart(2, "0")}
									</span>
									<span className="mt-0.5 shrink-0 text-tk-primary transition-colors duration-200 group-hover:text-tk-primary-deep">
										{icons[i]}
									</span>
									<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
										<h3 className="w-full max-w-[16rem] font-body font-bold text-base text-tk-ink">
											{item.title}
										</h3>
										<p className="font-body text-[0.9rem] text-tk-ink-2 leading-[1.65]">
											{item.desc}
										</p>
									</div>
								</div>
							</AnimateIn>
						))}
						<div className="border-tk-border border-t" />
					</div>
				</div>

				{/* Editorial pull-quote */}
				<Rule />
				<AnimateIn mode="fade">
					<div className="grid grid-cols-1 gap-6 py-16 lg:grid-cols-12 lg:py-20">
						<div className="lg:col-span-1" aria-hidden="true">
							<div className="h-full w-[3px] bg-tk-primary" />
						</div>
						<blockquote className="lg:col-span-11">
							<p className="font-display font-extrabold text-[clamp(1.5rem,3.2vw,2.5rem)] text-tk-ink leading-[1.15] tracking-[-0.03em]">
								{d.pain.highlight}
							</p>
							<p className="mt-4 max-w-[60ch] font-body text-base text-tk-ink-2 leading-[1.7]">
								{d.pain.highlight_sub}
							</p>
						</blockquote>
					</div>
				</AnimateIn>
			</div>
		</section>
	);
}
