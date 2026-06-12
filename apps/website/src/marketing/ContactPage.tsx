import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import type { Dict } from "@/i18n";
import { ContactFormDynamic } from "./ContactFormDynamic";
import { Lede, Rule, SectionHeading, SectionLabel } from "./Editorial";
import { StaticContactForm } from "./StaticContactForm";

interface ContactPageProps {
	dict: Dict;
	form?: FormType | null;
}

export function ContactPage({ dict: d, form }: ContactPageProps) {
	return (
		<main className="min-h-screen bg-tk-bg pt-[68px]">
			<div className="mx-auto max-w-[86rem] px-6 lg:px-10">
				{/* Editorial masthead */}
				<div className="pt-12 pb-10 lg:pt-16">
					<SectionLabel number="✶">Contact</SectionLabel>
					<SectionHeading as="h1" className="mt-6 max-w-3xl">
						{d.contact.title}
					</SectionHeading>
					<Lede className="mt-5">{d.contact.sub}</Lede>
				</div>
				<Rule />

				<div className="grid grid-cols-1 gap-x-12 gap-y-12 py-14 lg:grid-cols-12 lg:py-20">
					{/* Left: coordinates */}
					<div className="lg:col-span-5">
						<dl className="m-0">
							<div className="border-tk-border border-t py-5">
								<dt className="font-code text-[0.7rem] text-tk-muted uppercase tracking-[0.12em]">
									{d.contact.info.email_label}
								</dt>
								<dd className="m-0 mt-2">
									<a
										href="mailto:contact@tkams.com"
										className="font-body font-semibold text-base text-tk-primary no-underline"
									>
										contact@tkams.com
									</a>
								</dd>
							</div>
							<div className="border-tk-border border-t py-5">
								<dt className="font-code text-[0.7rem] text-tk-muted uppercase tracking-[0.12em]">
									{d.contact.info.location_label}
								</dt>
								<dd className="m-0 mt-2 font-body text-base text-tk-ink">
									{d.contact.info.location}
								</dd>
							</div>
							<div className="border-tk-border border-t" />
						</dl>

						{/* Pioneers accent panel */}
						<div className="mt-8 border border-tk-border border-l-[3px] border-l-tk-primary bg-tk-surface p-7">
							<p className="font-code font-semibold text-[0.7rem] text-tk-primary uppercase tracking-[0.12em]">
								Programme Pionniers
							</p>
							<h3 className="mt-3 font-bold font-display text-[1.0625rem] text-tk-ink tracking-[-0.02em]">
								{d.contact.info.charter_title}
							</h3>
							<p className="mt-2 font-body text-sm text-tk-ink-2 leading-[1.65]">
								{d.contact.info.charter_desc}
							</p>
						</div>
					</div>

					{/* Right: form */}
					<div className="lg:col-span-7">
						{form ? (
							<ContactFormDynamic form={form} dict={d} />
						) : (
							<StaticContactForm dict={d} />
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
