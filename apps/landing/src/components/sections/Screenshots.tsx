import { useState } from "react";
import { useReveal } from "../../hooks/use-reveal";
import { useI18n } from "../../i18n/context";

type Tab = { id: string; label: string; src: string };

export default function Screenshots() {
	const { tArr, t } = useI18n();
	const tabs = tArr("screenshots.tabs") as Tab[];
	const [active, setActive] = useState(0);
	const [fading, setFading] = useState(false);
	const ref = useReveal();

	const current = tabs[active] ?? tabs[0];

	function switchTab(i: number) {
		if (i === active) return;
		setFading(true);
		setTimeout(() => {
			setActive(i);
			setFading(false);
		}, 180);
	}

	return (
		<section id="screenshots" className="px-4 py-24" ref={ref as any}>
			<div className="section-divider mb-16" />
			<div className="page-wrap">
				{/* Header */}
				<div className="mb-12 text-center">
					<p className="island-kicker reveal mb-3">{t("screenshots.kicker")}</p>
					<h2
						className="display-title reveal mb-4 font-bold text-3xl text-[var(--sea-ink)] sm:text-4xl lg:text-5xl"
						style={{ transitionDelay: "80ms" }}
					>
						{t("screenshots.title")}
					</h2>
					<p
						className="reveal mx-auto max-w-xl text-[var(--sea-ink-soft)] text-base leading-7 sm:text-lg"
						style={{ transitionDelay: "160ms" }}
					>
						{t("screenshots.subtitle")}
					</p>
				</div>

				{/* Tabs */}
				<div
					className="reveal mb-6 flex flex-wrap justify-center gap-2"
					style={{ transitionDelay: "240ms" }}
				>
					{tabs.map((tab, i) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => switchTab(i)}
							className="rounded-full border px-4 py-2 font-semibold text-sm transition-all duration-200"
							style={
								i === active
									? {
											background: "var(--lagoon-deep)",
											color: "#fff",
											borderColor: "var(--lagoon-deep)",
											boxShadow: "0 4px 14px rgba(91,62,207,0.3)",
											transform: "translateY(-1px)",
										}
									: {
											background: "var(--chip-bg)",
											color: "var(--sea-ink-soft)",
											borderColor: "var(--chip-line)",
										}
							}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Mockup */}
				<div className="reveal" style={{ transitionDelay: "320ms" }}>
					<div className="island-shell overflow-hidden rounded-2xl">
						{/* Chrome bar */}
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
								app.tkams.com — {current?.label}
							</div>
						</div>

						{/* Screenshot with fade transition */}
						<div
							className="transition-opacity duration-[180ms]"
							style={{ opacity: fading ? 0 : 1 }}
						>
							{current && (
								<img
									key={current.id}
									src={current.src}
									alt={current.label}
									className="w-full object-cover object-top"
									style={{ maxHeight: "520px" }}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
