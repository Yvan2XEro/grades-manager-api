import { ArrowRight, ChevronDown } from "lucide-react";
import { useI18n } from "../../i18n/context";

const APP_URL = "https://app.tkams.com";

export default function Hero() {
	const { t } = useI18n();

	return (
		<section className="relative overflow-hidden px-4 pt-20 pb-0 sm:pt-28">
			{/* Background dots grid */}
			<div className="hero-dots -z-10 pointer-events-none absolute inset-0" />

			{/* Glow blobs */}
			<div
				className="-z-10 -translate-x-1/2 pointer-events-none absolute top-0 left-1/2 h-[600px] w-[900px] rounded-full blur-3xl"
				style={{
					background:
						"radial-gradient(ellipse, rgba(91,62,207,0.16), transparent 68%)",
				}}
			/>
			<div
				className="-right-32 -z-10 pointer-events-none absolute top-32 h-64 w-64 rounded-full blur-2xl"
				style={{ background: "rgba(130,100,230,0.1)" }}
			/>
			<div
				className="-left-20 -z-10 pointer-events-none absolute bottom-20 h-48 w-48 rounded-full blur-2xl"
				style={{ background: "rgba(91,62,207,0.08)" }}
			/>

			<div className="page-wrap">
				{/* Badge */}
				<div
					className="rise-in mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-semibold text-xs"
					style={{
						borderColor: "var(--chip-line)",
						background: "var(--chip-bg)",
						color: "var(--lagoon-deep)",
					}}
				>
					<span className="relative flex h-2 w-2">
						<span
							className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
							style={{ background: "var(--lagoon-deep)" }}
						/>
						<span
							className="relative inline-flex h-2 w-2 rounded-full"
							style={{ background: "var(--lagoon-deep)" }}
						/>
					</span>
					{t("hero.badge")}
				</div>

				{/* Headline */}
				<h1
					className="display-title rise-in mb-6 max-w-3xl font-bold text-4xl text-[var(--sea-ink)] leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
					style={{ animationDelay: "60ms" }}
				>
					{t("hero.title1")}
					<br />
					<span className="gradient-text">{t("hero.title2")}</span>
				</h1>

				{/* Subtitle */}
				<p
					className="rise-in mb-10 max-w-xl text-[var(--sea-ink-soft)] text-base leading-7 sm:text-lg sm:leading-8"
					style={{ animationDelay: "120ms" }}
				>
					{t("hero.subtitle")}
				</p>

				{/* CTAs */}
				<div
					className="rise-in mb-14 flex flex-wrap gap-3"
					style={{ animationDelay: "180ms" }}
				>
					<a
						href={APP_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="cta-primary group"
					>
						{t("hero.cta_primary")}
						<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
					</a>
					<a href="#features" className="cta-secondary">
						{t("hero.cta_secondary")}
						<ChevronDown className="h-4 w-4" />
					</a>
				</div>

				{/* Stats */}
				<div
					className="rise-in mb-16 flex flex-wrap gap-8 sm:gap-12"
					style={{ animationDelay: "240ms" }}
				>
					{(
						[
							[t("hero.stat1_value"), t("hero.stat1_label")],
							[t("hero.stat2_value"), t("hero.stat2_label")],
							[t("hero.stat3_value"), t("hero.stat3_label")],
						] as [string, string][]
					).map(([val, label]) => (
						<div key={label} className="flex items-baseline gap-2">
							<span
								className="gradient-text font-bold text-2xl sm:text-3xl"
								style={{ fontFamily: "var(--font-heading)" }}
							>
								{val}
							</span>
							<span className="text-[var(--sea-ink-soft)] text-sm">
								{label}
							</span>
						</div>
					))}
				</div>

				{/* Browser mockup */}
				<div
					className="rise-in relative mx-auto max-w-4xl"
					style={{ animationDelay: "300ms" }}
				>
					<div
						className="-inset-8 -z-10 pointer-events-none absolute rounded-3xl blur-3xl"
						style={{
							background:
								"radial-gradient(ellipse, rgba(91,62,207,0.14), transparent 68%)",
						}}
					/>

					{/* Floating decoration orbs */}
					<div
						className="float -right-6 -top-6 pointer-events-none absolute h-14 w-14 rounded-full border border-[var(--line)]"
						style={{ background: "var(--sand)", animationDelay: "0.5s" }}
					/>
					<div
						className="float -bottom-4 -left-6 pointer-events-none absolute h-9 w-9 rounded-full"
						style={{
							background: "var(--lagoon-deep)",
							opacity: 0.25,
							animationDelay: "1.5s",
						}}
					/>

					<div className="island-shell overflow-hidden rounded-2xl">
						{/* Browser chrome */}
						<div
							className="flex items-center gap-3 border-b px-4 py-3"
							style={{
								borderColor: "var(--line)",
								background:
									"color-mix(in oklab, var(--surface-strong) 96%, white 4%)",
							}}
						>
							<div className="flex gap-1.5">
								<span className="h-3 w-3 rounded-full bg-red-400/80" />
								<span className="h-3 w-3 rounded-full bg-yellow-400/80" />
								<span className="h-3 w-3 rounded-full bg-green-400/80" />
							</div>
							<div
								className="flex-1 rounded-md px-3 py-1 text-center font-medium text-xs"
								style={{
									background: "var(--chip-bg)",
									color: "var(--sea-ink-soft)",
								}}
							>
								app.tkams.com
							</div>
						</div>

						{/* Screenshot fading at bottom */}
						<div
							style={{
								maskImage:
									"linear-gradient(to bottom, black 60%, transparent 100%)",
							}}
						>
							<img
								src="/screens/dashboard.png"
								alt="TKAMS dashboard"
								className="w-full object-cover object-top"
								style={{ maxHeight: "420px" }}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
