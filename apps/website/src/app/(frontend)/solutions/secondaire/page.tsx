import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/i18n";
import { Lede, SectionHeading, SectionLabel } from "@/marketing/Editorial";

export default async function SecondaryPage() {
	const t = getDict(await getLocale()).secondary;
	const demoHref = `mailto:contact@tkams.com?subject=${encodeURIComponent(t.contact_subject)}`;
	return (
		<main className="bg-tk-bg pt-[68px]">
			<section className="mx-auto max-w-[86rem] px-6 py-16 lg:px-10 lg:py-24">
				<SectionLabel number="✶">{t.available}</SectionLabel>
				<SectionHeading as="h1" className="mt-6 max-w-5xl">
					{t.page_title}
				</SectionHeading>
				<Lede className="mt-6 max-w-3xl">{t.page_intro}</Lede>
				<div className="mt-8 flex flex-wrap gap-4">
					<a href={demoHref} className="tk-btn-primary">
						{t.cta}
					</a>
					<Link href="/produit" className="tk-btn-outline">
						{t.higher_cta}
					</Link>
				</div>
			</section>
			<section className="bg-tk-surface px-6 py-16 lg:px-10">
				<div className="mx-auto max-w-[81rem]">
					<SectionHeading>{t.features_title}</SectionHeading>
					<div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
						{t.features.map((feature) => (
							<div
								key={feature.title}
								className="border-tk-border border-t pt-6"
							>
								<h3 className="font-bold font-display text-tk-ink text-xl">
									{feature.title}
								</h3>
								<p className="mt-3 text-tk-ink-2 leading-relaxed">
									{feature.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>
			<section className="mx-auto grid max-w-[86rem] gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
				<div>
					<SectionHeading>{t.journey_title}</SectionHeading>
					<Lede className="mt-5">{t.journey_desc}</Lede>
				</div>
				<div className="rounded-2xl border border-tk-border bg-tk-surface p-8">
					<h2 className="font-bold font-display text-2xl text-tk-ink">
						{t.pricing}
					</h2>
					<p className="mt-4 mb-6 text-tk-ink-2 leading-relaxed">
						{t.pricing_desc}
					</p>
					<a href={demoHref} className="tk-btn-primary">
						{t.cta}
					</a>
				</div>
			</section>
			<section className="mx-auto max-w-[86rem] px-6 pb-16 lg:px-10">
				<SectionHeading>{t.faq_title}</SectionHeading>
				<div className="mt-8">
					{t.faq.map((item) => (
						<details key={item.q} className="border-tk-border border-b py-5">
							<summary className="cursor-pointer font-semibold text-tk-ink">
								{item.q}
							</summary>
							<p className="mt-4 max-w-3xl text-tk-ink-2 leading-relaxed">
								{item.a}
							</p>
						</details>
					))}
				</div>
				<div className="mt-12">
					<h2 className="mb-5 font-bold font-display text-2xl text-tk-ink">
						{t.articles_title}
					</h2>
					<Link href="/posts" className="tk-btn-outline">
						{t.articles_cta}
					</Link>
				</div>
			</section>
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const t = getDict(await getLocale()).secondary;
	return {
		title: t.page_title,
		description: t.page_intro,
		openGraph: {
			title: t.page_title,
			description: t.page_intro,
			url: "/solutions/secondaire",
		},
	};
}
