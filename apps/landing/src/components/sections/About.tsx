import { ExternalLink } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";
import { useI18n } from "../../i18n/context";

const OVERBRAND_URL = "https://overbrand.net";

export default function About() {
	const { t } = useI18n();
	const ref = useReveal();

	const stats = [
		[t("about.stat1_value"), t("about.stat1_label")],
		[t("about.stat2_value"), t("about.stat2_label")],
		[t("about.stat3_value"), t("about.stat3_label")],
	] as [string, string][];

	return (
		<section id="about" className="px-4 py-24" ref={ref as any}>
			<div className="section-divider mb-16" />
			<div className="page-wrap">
				<div
					className="reveal reveal-scale relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-14"
					style={{
						background: "linear-gradient(135deg, #4c35b5, #3b28a0)",
						boxShadow:
							"0 32px 64px rgba(91,62,207,0.32), 0 8px 24px rgba(91,62,207,0.2)",
					}}
				>
					{/* Animated background orbs */}
					<div
						className="float -right-16 -top-16 pointer-events-none absolute h-48 w-48 rounded-full blur-3xl"
						style={{
							background: "rgba(255,255,255,0.07)",
							animationDelay: "0s",
						}}
					/>
					<div
						className="float -bottom-12 -left-12 pointer-events-none absolute h-36 w-36 rounded-full blur-2xl"
						style={{
							background: "rgba(255,255,255,0.05)",
							animationDelay: "2s",
						}}
					/>
					<div
						className="float pointer-events-none absolute top-1/4 left-1/3 h-24 w-24 rounded-full blur-2xl"
						style={{
							background: "rgba(255,255,255,0.04)",
							animationDelay: "1s",
						}}
					/>

					<p
						className="island-kicker relative mb-4"
						style={{ color: "rgba(255,255,255,0.65)" }}
					>
						{t("about.kicker")}
					</p>

					<h2
						className="display-title relative mb-6 font-bold text-3xl sm:text-4xl lg:text-5xl"
						style={{ color: "#fff" }}
					>
						{t("about.title")}
					</h2>

					<p
						className="relative mx-auto mb-4 max-w-2xl text-base leading-7 sm:text-lg"
						style={{ color: "rgba(255,255,255,0.82)" }}
					>
						{t("about.description")}
					</p>

					<p
						className="relative mb-10 font-semibold text-sm italic"
						style={{ color: "rgba(255,255,255,0.55)" }}
					>
						{t("about.tagline")}
					</p>

					{/* Stats */}
					<div className="relative mb-10 flex flex-wrap justify-center gap-x-14 gap-y-6">
						{stats.map(([val, label]) => (
							<div key={label} className="text-center">
								<div
									className="font-bold text-3xl text-white"
									style={{ fontFamily: "var(--font-heading)" }}
								>
									{val}
								</div>
								<div
									className="mt-1 font-medium text-xs"
									style={{ color: "rgba(255,255,255,0.6)" }}
								>
									{label}
								</div>
							</div>
						))}
					</div>

					<a
						href={OVERBRAND_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="hover:-translate-y-1 relative inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 font-semibold text-sm no-underline transition hover:bg-white/20"
						style={{
							borderColor: "rgba(255,255,255,0.35)",
							background: "rgba(255,255,255,0.1)",
							backdropFilter: "blur(8px)",
							transitionDelay: "380ms",
							color: "#fff",
						}}
					>
						{t("about.cta")}
						<ExternalLink className="h-3.5 w-3.5" />
					</a>
				</div>
			</div>
		</section>
	);
}
