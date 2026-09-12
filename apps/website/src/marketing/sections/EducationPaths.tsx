import Link from "next/link";
import type { Dict } from "@/i18n";
import { Lede, SectionHeading, SectionLabel } from "../Editorial";

export function EducationPaths({ dict }: { dict: Dict }) {
	const t = dict.secondary;
	return (
		<section className="bg-tk-surface py-16">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<SectionLabel number="✶">{t.label}</SectionLabel>
				<SectionHeading className="mt-5">{t.title}</SectionHeading>
				<Lede className="mt-5 max-w-3xl">{t.intro}</Lede>
				<div className="mt-10 grid gap-6 md:grid-cols-2">
					{[
						{
							title: t.higher_title,
							desc: t.higher_desc,
							href: "/produit",
							cta: t.higher_cta,
						},
						{
							title: t.secondary_title,
							desc: t.secondary_desc,
							href: "/solutions/secondaire",
							cta: t.discover,
						},
					].map((path) => (
						<div
							key={path.href}
							className="flex flex-col items-start rounded-2xl border border-tk-border bg-tk-bg p-8"
						>
							<h3 className="font-bold font-display text-2xl text-tk-ink">
								{path.title}
							</h3>
							<p className="mt-4 mb-7 flex-1 font-body text-tk-ink-2 leading-relaxed">
								{path.desc}
							</p>
							<Link href={path.href} className="tk-btn-outline">
								{path.cta}
							</Link>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export function HigherEducationScope({ dict }: { dict: Dict }) {
	return (
		<div className="border-tk-border border-y bg-tk-bg px-6 py-8 text-center">
			<h2 className="font-bold font-display text-tk-ink text-xl">
				{dict.secondary.scope}
			</h2>
			<p className="mt-2 text-tk-ink-2">{dict.secondary.scope_desc}</p>
		</div>
	);
}
