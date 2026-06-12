import type { Metadata } from "next";
import { getDict, getLocale } from "@/i18n";
import { HowItWorks } from "@/marketing/blocks/HowItWorks";
import { DeliberationDemo } from "@/marketing/demos/DeliberationDemo";
import { DemoFrame } from "@/marketing/demos/DemoFrame";
import { GradeEntryDemo } from "@/marketing/demos/GradeEntryDemo";
import { RulesEngineDemo } from "@/marketing/demos/RulesEngineDemo";
import {
	Lede,
	Rule,
	SectionHeading,
	SectionLabel,
} from "@/marketing/Editorial";
import { Cta } from "@/marketing/sections/Cta";
import { Features } from "@/marketing/sections/Features";
import { Modules } from "@/marketing/sections/Modules";

export default async function ProduitPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const p = dict.produit;

	const demos = [
		{
			num: "01",
			...p.demos.grade,
			url: "app.tkams.com/saisie",
			node: <GradeEntryDemo t={dict.demos.grade} />,
		},
		{
			num: "02",
			...p.demos.rules,
			url: "app.tkams.com/regles",
			node: <RulesEngineDemo t={dict.demos.rules} />,
		},
		{
			num: "03",
			...p.demos.delib,
			url: "app.tkams.com/deliberations",
			node: <DeliberationDemo t={dict.demos.delib} />,
		},
	];

	return (
		<main className="bg-tk-bg pt-[68px]">
			{/* Masthead */}
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="pt-12 pb-4 lg:pt-16">
					<SectionLabel number="✶">{p.label}</SectionLabel>
					<SectionHeading as="h1" className="mt-6 max-w-4xl">
						{p.title}
					</SectionHeading>
					<Lede className="mt-5 max-w-[52ch]">{p.sub}</Lede>
				</div>
			</div>

			{/* Interactive demos — the product in action */}
			{demos.map((demo, i) => (
				<section
					key={demo.num}
					className={i % 2 === 0 ? "bg-tk-bg" : "bg-tk-surface"}
				>
					<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
						<Rule />
						<div className="grid grid-cols-1 gap-x-12 gap-y-8 py-14 lg:grid-cols-12 lg:py-20">
							<div className="lg:col-span-4">
								<div className="lg:sticky lg:top-28">
									<SectionLabel number={demo.num}>{demo.title}</SectionLabel>
									<SectionHeading className="mt-6 text-[clamp(1.5rem,2.5vw,2.25rem)]">
										{demo.title}
									</SectionHeading>
									<Lede className="mt-4">{demo.desc}</Lede>
								</div>
							</div>
							<div className="lg:col-span-8">
								<DemoFrame url={demo.url}>{demo.node}</DemoFrame>
							</div>
						</div>
					</div>
				</section>
			))}

			<HowItWorks data={dict.blocks.howItWorks} number="04" bg="bg-tk-bg" />
			<Features dict={dict} number="05" />
			<Modules dict={dict} number="06" />
			<Cta dict={dict} number="07" />
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const p = getDict(locale).produit;
	return { title: `${p.title} — TKAMS`, description: p.sub };
}
