import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import type { Dict } from "@/i18n";
import { ContactFormDynamic } from "./ContactFormDynamic";

interface ContactPageProps {
	dict: Dict;
	form?: FormType | null;
}

export function ContactPage({ dict: d, form }: ContactPageProps) {
	return (
		<main className="min-h-screen bg-tk-bg pt-[68px]">
			<section className="relative overflow-hidden bg-tk-dark px-6 py-20 pb-16">
				<div className="tk-grid-pattern absolute inset-0 z-0" />
				<div
					className="-translate-x-1/2 pointer-events-none absolute top-0 left-1/2 z-[1] h-[300px] w-[600px]"
					style={{
						background:
							"radial-gradient(ellipse at center, oklch(0.48 0.2 277 / 0.15) 0%, transparent 70%)",
					}}
				/>
				<div className="relative z-[2] mx-auto max-w-3xl text-center">
					<h1 className="mb-4 font-display font-extrabold text-[clamp(2rem,5vw,3rem)] text-tk-on-dark tracking-[-0.04em]">
						{d.contact.title}
					</h1>
					<p className="font-body text-[1.0625rem] text-tk-on-dark-soft leading-[1.7]">
						{d.contact.sub}
					</p>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto grid max-w-[72rem] grid-cols-1 items-start gap-16 md:grid-cols-[1fr_1.5fr]">
					<div>
						<div className="mb-6 rounded-[1.25rem] border border-tk-border bg-tk-surface p-8">
							<div className="mb-6">
								<p className="mb-1.5 font-bold font-code text-[0.75rem] text-tk-muted uppercase tracking-[0.08em]">
									{d.contact.info.email_label}
								</p>
								<a
									href="mailto:contact@tkams.com"
									className="font-body font-semibold text-base text-tk-primary no-underline"
								>
									contact@tkams.com
								</a>
							</div>

							<div>
								<p className="mb-1.5 font-bold font-code text-[0.75rem] text-tk-muted uppercase tracking-[0.08em]">
									{d.contact.info.location_label}
								</p>
								<p className="font-body text-base text-tk-ink">
									{d.contact.info.location}
								</p>
							</div>
						</div>

						<div className="relative overflow-hidden rounded-[1.25rem] border border-[oklch(0.48_0.2_277/0.3)] bg-[linear-gradient(135deg,var(--tk-primary-deep),var(--tk-primary))] p-8">
							<div
								className="absolute inset-0"
								style={{
									backgroundImage:
										"linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
									backgroundSize: "24px 24px",
								}}
							/>
							<div className="relative z-[1]">
								<p className="mb-4 inline-block rounded-full bg-white/15 px-3 py-1 font-bold font-code text-[0.75rem] text-white/90 tracking-[0.05em]">
									PROGRAMME PIONNIERS
								</p>
								<h3 className="mb-3 font-bold font-display text-[1.0625rem] text-white tracking-[-0.02em]">
									{d.contact.info.charter_title}
								</h3>
								<p className="font-body text-sm text-white/80 leading-[1.65]">
									{d.contact.info.charter_desc}
								</p>
							</div>
						</div>
					</div>

					<div>
						{form ? (
							<ContactFormDynamic form={form} dict={d} />
						) : (
							<div className="rounded-[1.25rem] border border-tk-border bg-tk-surface p-10 text-center">
								<p className="font-body text-tk-ink-soft">
									{"Contactez-nous directement à "}
									<a
										href="mailto:contact@tkams.com"
										className="font-semibold text-tk-primary no-underline"
									>
										contact@tkams.com
									</a>
								</p>
							</div>
						)}
					</div>
				</div>
			</section>
		</main>
	);
}
