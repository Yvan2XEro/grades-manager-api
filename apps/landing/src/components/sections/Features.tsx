import {
	BookOpen,
	FileDown,
	GitBranch,
	GraduationCap,
	Plug,
	Trophy,
} from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";
import { useI18n } from "../../i18n/context";

const icons = [BookOpen, Trophy, FileDown, GraduationCap, GitBranch, Plug];

export default function Features() {
	const { tArr, t } = useI18n();
	const items = tArr("features.items");
	const ref = useReveal();

	return (
		<section id="features" className="px-4 py-24" ref={ref as any}>
			<div className="section-divider mb-16" />
			<div className="page-wrap">
				{/* Header */}
				<div className="mb-14 text-center">
					<p className="island-kicker reveal mb-3">{t("features.kicker")}</p>
					<h2
						className="display-title reveal mb-4 font-bold text-3xl text-[var(--sea-ink)] sm:text-4xl lg:text-5xl"
						style={{ transitionDelay: "80ms" }}
					>
						{t("features.title")}
					</h2>
					<p
						className="reveal mx-auto max-w-xl text-[var(--sea-ink-soft)] text-base leading-7 sm:text-lg"
						style={{ transitionDelay: "160ms" }}
					>
						{t("features.subtitle")}
					</p>
				</div>

				{/* Grid */}
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{items.map(
						(item: { title: string; description: string }, i: number) => {
							const Icon = icons[i] ?? BookOpen;
							return (
								<article
									key={i}
									className="island-shell feature-card reveal rounded-2xl p-6"
									style={{ transitionDelay: `${i * 80 + 200}ms` }}
								>
									<div
										className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
										style={{
											background: "var(--sand)",
											color: "var(--lagoon-deep)",
										}}
									>
										<Icon className="h-5 w-5" strokeWidth={2} />
									</div>
									<h3 className="mb-2 font-semibold text-[var(--sea-ink)] text-base">
										{item.title}
									</h3>
									<p className="m-0 text-[var(--sea-ink-soft)] text-sm leading-6">
										{item.description}
									</p>
								</article>
							);
						},
					)}
				</div>
			</div>
		</section>
	);
}
