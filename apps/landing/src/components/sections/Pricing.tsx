import { Check } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";
import { useI18n } from "../../i18n/context";

const CONTACT_URL = "https://overbrand.net";

type Plan = {
	name: string;
	description: string;
	highlight: boolean;
	badge: string | null;
	setup: string;
	annual: string[];
	features: string[];
};

export default function Pricing() {
	const { tArr, t } = useI18n();
	const plans = tArr("pricing.plans") as Plan[];
	const ref = useReveal();

	return (
		<section id="pricing" className="px-4 py-24" ref={ref as any}>
			<div className="section-divider mb-16" />
			<div className="page-wrap">
				{/* Header */}
				<div className="mb-14 text-center">
					<p className="island-kicker reveal mb-3">{t("pricing.kicker")}</p>
					<h2
						className="display-title reveal mb-4 font-bold text-3xl text-[var(--sea-ink)] sm:text-4xl lg:text-5xl"
						style={{ transitionDelay: "80ms" }}
					>
						{t("pricing.title")}
					</h2>
					<p
						className="reveal mx-auto max-w-xl text-[var(--sea-ink-soft)] text-base leading-7 sm:text-lg"
						style={{ transitionDelay: "160ms" }}
					>
						{t("pricing.subtitle")}
					</p>
				</div>

				{/* Cards */}
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{plans.map((plan, i) => (
						<article
							key={i}
							className={`island-shell reveal flex flex-col rounded-2xl p-7 ${plan.highlight ? "highlight-card" : ""}`}
							style={{ transitionDelay: `${i * 100 + 200}ms` }}
						>
							{plan.badge && (
								<span
									className="mb-3 inline-flex w-fit rounded-full px-3 py-0.5 font-bold text-xs"
									style={{
										background: "var(--sand)",
										color: "var(--lagoon-deep)",
									}}
								>
									{plan.badge}
								</span>
							)}

							<h3
								className="mb-1 font-bold text-[var(--sea-ink)] text-xl"
								style={{ fontFamily: "var(--font-heading)" }}
							>
								{plan.name}
							</h3>
							<p className="mb-5 text-[var(--sea-ink-soft)] text-sm">
								{plan.description}
							</p>

							{/* Setup fee */}
							<div
								className="mb-4 rounded-xl px-4 py-3"
								style={{ background: "var(--sand)" }}
							>
								<p
									className="mb-0.5 font-semibold text-xs uppercase tracking-wide"
									style={{ color: "var(--lagoon-deep)" }}
								>
									{t("pricing.label_setup")}
								</p>
								<p className="font-bold text-[var(--sea-ink)] text-base">
									{plan.setup}
								</p>
							</div>

							{/* Annual license */}
							<div className="mb-5">
								<p
									className="mb-2 font-semibold text-xs uppercase tracking-wide"
									style={{ color: "var(--sea-ink-soft)" }}
								>
									{t("pricing.label_annual")}
								</p>
								<ul className="m-0 flex list-none flex-col gap-1 p-0">
									{plan.annual.map((line: string, ai: number) => (
										<li key={ai} className="text-[var(--sea-ink)] text-sm">
											{line}
										</li>
									))}
								</ul>
							</div>

							<div
								className="section-divider mb-5 w-full"
								style={{ margin: "0 0 1.25rem" }}
							/>

							<ul className="m-0 mb-8 flex flex-grow list-none flex-col gap-3 p-0">
								{plan.features.map((f: string, fi: number) => (
									<li
										key={fi}
										className="flex items-start gap-2.5 text-[var(--sea-ink-soft)] text-sm"
									>
										<Check
											className="mt-0.5 h-4 w-4 flex-shrink-0"
											style={{ color: "var(--lagoon-deep)" }}
										/>
										{f}
									</li>
								))}
							</ul>

							<a
								href={CONTACT_URL}
								target="_blank"
								rel="noopener noreferrer"
								className={`hover:-translate-y-0.5 mt-auto rounded-full px-5 py-3 text-center font-semibold text-sm no-underline transition ${plan.highlight ? "cta-primary" : "cta-secondary"}`}
							>
								{t("pricing.contact")}
							</a>
						</article>
					))}
				</div>

				<p
					className="reveal mt-8 text-center text-[var(--sea-ink-soft)] text-sm"
					style={{ transitionDelay: "500ms" }}
				>
					{t("pricing.note")}
				</p>
			</div>
		</section>
	);
}
