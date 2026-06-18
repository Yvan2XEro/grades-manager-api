import { Check } from "lucide-react";
import type { Metadata } from "next";
import { getDict, getLocale } from "@/i18n";
import { Benefits } from "@/marketing/blocks/Benefits";
import { Reassurance } from "@/marketing/blocks/Reassurance";
import {
	Lede,
	Rule,
	SectionHeading,
	SectionLabel,
} from "@/marketing/Editorial";
import { Cta } from "@/marketing/sections/Cta";
import { Faq } from "@/marketing/sections/Faq";
import { Pricing } from "@/marketing/sections/Pricing";

export default async function TarifsPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const t = dict.tarifs;

	return (
		<main className="bg-tk-bg pt-[68px]">
			{/* Masthead */}
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="pt-12 pb-12 lg:pt-16">
					<SectionLabel number="✶">{t.label}</SectionLabel>
					<SectionHeading as="h1" className="mt-6 max-w-3xl">
						{t.title}
					</SectionHeading>
					<Lede className="mt-5">{t.sub}</Lede>
				</div>
			</div>

			<Pricing dict={dict} number="01" />

			{/* What's included */}
			<section className="bg-tk-surface">
				<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
					<Rule />
					<div className="py-16 lg:py-24">
						<div className="max-w-2xl">
							<SectionLabel number="02">{t.included_title}</SectionLabel>
							<SectionHeading className="mt-6">
								{t.included_title}
							</SectionHeading>
							<Lede className="mt-5">{t.included_sub}</Lede>
						</div>
						<ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
							{t.included.map((item) => (
								<li
									key={item}
									className="flex items-center gap-3 border-tk-border border-t py-4 font-body text-[0.95rem] text-tk-ink"
								>
									<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[oklch(0.58_0.17_149/0.14)] text-tk-accent-emerald">
										<Check size={13} strokeWidth={2.5} />
									</span>
									{item}
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			<Benefits data={dict.blocks.benefits} number="03" bg="bg-tk-bg" />
			<Reassurance
				data={dict.blocks.reassurance}
				number="04"
				bg="bg-tk-surface"
			/>
			<Faq dict={dict} number="05" />
			<Cta dict={dict} number="06" />
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const t = getDict(locale).tarifs;
	return { title: `${t.title} — TKAMS`, description: t.sub };
}
