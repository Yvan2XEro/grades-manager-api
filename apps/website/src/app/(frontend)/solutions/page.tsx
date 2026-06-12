import { Check } from "lucide-react";
import type { Metadata } from "next";
import { getDict, getLocale } from "@/i18n";
import { BeforeAfter } from "@/marketing/blocks/BeforeAfter";
import { Testimonials } from "@/marketing/blocks/Testimonials";
import { ApprovalsDemo } from "@/marketing/demos/ApprovalsDemo";
import { AttendanceDemo } from "@/marketing/demos/AttendanceDemo";
import { DemoFrame } from "@/marketing/demos/DemoFrame";
import { DocExportDemo } from "@/marketing/demos/DocExportDemo";
import {
	Lede,
	Rule,
	SectionHeading,
	SectionLabel,
} from "@/marketing/Editorial";
import { Cta } from "@/marketing/sections/Cta";

export default async function SolutionsPage() {
	const locale = await getLocale();
	const dict = getDict(locale);
	const s = dict.solutions;

	const demos = [
		{
			url: "app.tkams.com/presences",
			node: <AttendanceDemo t={dict.demos.attendance} />,
		},
		{
			url: "app.tkams.com/validations",
			node: <ApprovalsDemo t={dict.demos.approvals} />,
		},
		{
			url: "app.tkams.com/documents",
			node: <DocExportDemo t={dict.demos.docexport} />,
		},
	];

	return (
		<main className="bg-tk-bg pt-[68px]">
			{/* Masthead */}
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				<div className="pt-12 pb-12 lg:pt-16">
					<SectionLabel number="✶">{s.label}</SectionLabel>
					<SectionHeading as="h1" className="mt-6 max-w-4xl">
						{s.title}
					</SectionHeading>
					<Lede className="mt-5 max-w-[52ch]">{s.sub}</Lede>
				</div>
			</div>

			<BeforeAfter
				data={dict.blocks.beforeAfter}
				number="01"
				bg="bg-tk-surface"
			/>

			{s.roles.map((role, i) => {
				const flipped = i % 2 === 1;
				const num = String(i + 2).padStart(2, "0");
				const demo = demos[i % demos.length];
				return (
					<section
						key={role.role}
						className={flipped ? "bg-tk-surface" : "bg-tk-bg"}
					>
						<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
							<Rule />
							<div className="grid grid-cols-1 gap-x-12 gap-y-10 py-16 lg:grid-cols-12 lg:py-24">
								{/* Copy */}
								<div className={`lg:col-span-5 ${flipped ? "lg:order-2" : ""}`}>
									<SectionLabel number={num}>{role.role}</SectionLabel>
									<p className="mt-6 font-body text-[0.9rem] text-tk-muted italic">
										{role.pain}
									</p>
									<SectionHeading className="mt-2 text-[clamp(1.5rem,2.6vw,2.25rem)]">
										{role.title}
									</SectionHeading>
									<Lede className="mt-4">{role.desc}</Lede>
									<ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
										{role.points.map((point) => (
											<li
												key={point}
												className="flex items-start gap-3 font-body text-[0.9rem] text-tk-ink-2"
											>
												<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[oklch(0.58_0.17_149/0.14)] text-tk-accent-emerald">
													<Check size={12} strokeWidth={2.5} />
												</span>
												{point}
											</li>
										))}
									</ul>
								</div>

								{/* Interactive screen */}
								<div className={`lg:col-span-7 ${flipped ? "lg:order-1" : ""}`}>
									<DemoFrame url={demo.url}>{demo.node}</DemoFrame>
								</div>
							</div>
						</div>
					</section>
				);
			})}

			<Testimonials
				data={dict.blocks.testimonials}
				number="05"
				bg="bg-tk-surface"
			/>
			<Cta dict={dict} number="06" />
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const s = getDict(locale).solutions;
	return { title: `${s.title} — TKAMS`, description: s.sub };
}
