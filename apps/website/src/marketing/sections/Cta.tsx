import Link from "next/link";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";

interface CtaProps {
	dict: Dict;
}

export function Cta({ dict: d }: CtaProps) {
	return (
		<section className="relative overflow-hidden bg-tk-dark px-6 py-28">
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse at center, oklch(0.48 0.2 277 / 0.15) 0%, transparent 70%)",
				}}
			/>
			<div className="tk-grid-pattern absolute inset-0" />

			<div className="relative z-[1] mx-auto max-w-3xl text-center">
				<AnimateIn>
					<h2 className="mb-5 font-display font-extrabold text-[clamp(1.875rem,4vw,3rem)] text-tk-on-dark leading-[1.15] tracking-[-0.04em]">
						{d.cta.title}
					</h2>
				</AnimateIn>

				<AnimateIn delay={100}>
					<p className="mb-10 font-body text-[1.0625rem] text-tk-on-dark-soft leading-[1.7]">
						{d.cta.sub}
					</p>
				</AnimateIn>

				<AnimateIn delay={200}>
					<div className="flex flex-wrap justify-center gap-4">
						<Link
							href="/contact"
							className="tk-btn-primary"
							style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}
						>
							{d.cta.primary}
						</Link>
						<a
							href={`mailto:${d.cta.secondary}`}
							className="tk-btn-ghost"
							style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}
						>
							{d.cta.secondary}
						</a>
					</div>
				</AnimateIn>

				<AnimateIn delay={350} mode="fade">
					<p className="mt-12 font-code text-[0.8125rem] text-[oklch(0.35_0.02_264)]">
						<a
							href="https://www.overbrand.net/"
							target="_blank"
							rel="noopener noreferrer"
							className="no-underline transition-colors duration-150 hover:text-tk-on-dark-muted"
						>
							OverBrand
						</a>
						{" · Douala · Yaoundé · contact@tkams.com"}
					</p>
				</AnimateIn>
			</div>
		</section>
	);
}
