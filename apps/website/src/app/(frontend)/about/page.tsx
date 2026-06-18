import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/i18n";
import {
	Lede,
	Rule,
	SectionHeading,
	SectionLabel,
} from "@/marketing/Editorial";

export default async function AboutPage() {
	const locale = await getLocale();
	const d = getDict(locale);
	const a = d.about;

	return (
		<main className="min-h-screen bg-tk-bg pt-[68px]">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				{/* Masthead */}
				<div className="pt-12 pb-10 lg:pt-16">
					<SectionLabel number="✶">{a.label}</SectionLabel>
					<SectionHeading as="h1" className="mt-6 max-w-4xl">
						{a.title}
					</SectionHeading>
					<Lede className="mt-5 max-w-[52ch]">{a.intro}</Lede>
				</div>
				<Rule />

				{/* Mission + values */}
				<div className="grid grid-cols-1 gap-x-12 gap-y-10 py-16 lg:grid-cols-12 lg:py-20">
					<div className="lg:col-span-4">
						<div className="lg:sticky lg:top-28">
							<SectionLabel number="01">{a.mission_title}</SectionLabel>
							<p className="mt-6 font-bold font-display text-[clamp(1.25rem,2vw,1.625rem)] text-tk-ink leading-[1.3] tracking-[-0.02em]">
								{a.mission}
							</p>
						</div>
					</div>

					<div className="lg:col-span-8">
						{a.values.map((v, i) => (
							<div
								key={v.title}
								className="flex items-start gap-5 border-tk-border border-t py-7 last:border-b"
							>
								<span className="mt-1 w-6 shrink-0 font-code text-[0.7rem] text-tk-muted tabular-nums">
									{String(i + 1).padStart(2, "0")}
								</span>
								<div>
									<h3 className="font-bold font-display text-lg text-tk-ink tracking-[-0.02em]">
										{v.title}
									</h3>
									<p className="mt-2 max-w-[52ch] font-body text-[0.95rem] text-tk-ink-2 leading-[1.7]">
										{v.desc}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Location + CTA */}
				<Rule />
				<div className="flex flex-wrap items-end justify-between gap-6 py-12">
					<div>
						<p className="font-code text-[0.7rem] text-tk-muted uppercase tracking-[0.14em]">
							{a.location_label}
						</p>
						<p className="mt-2 font-bold font-display text-tk-ink text-xl tracking-[-0.02em]">
							{a.location}
						</p>
					</div>
					<div className="flex flex-col items-start gap-3">
						<p className="font-body text-[1.0625rem] text-tk-ink-2">
							{a.cta_title}
						</p>
						<Link href="/contact" className="tk-btn-primary">
							{a.cta}
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}

export const metadata: Metadata = {
	title: "À propos — TKAMS",
	description:
		"TKAMS, plateforme de gestion académique LMD éditée par OverBrand pour les institutions d'Afrique francophone.",
};
