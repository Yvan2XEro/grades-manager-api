"use client";
import type { Dict } from "@/i18n";
import { AnimateIn } from "../AnimateIn";

interface PainProps {
	dict: Dict;
}

const icons = [
	// Saisie laborieuse — crayon sur lignes
	<svg key="0" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<path
			d="M13 3.5l3.5 3.5L7 17H3.5V13.5L13 3.5z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<path
			d="M11 5.5l3.5 3.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
	// Calculs manuels — sigma/croix
	<svg key="1" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<rect
			x="3"
			y="3"
			width="14"
			height="14"
			rx="3"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<path
			d="M7 7l6 6M13 7l-6 6"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
	// Délibérations papier — document + horloge
	<svg key="2" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<path
			d="M10.5 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<circle cx="14.5" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
		<path
			d="M14.5 4.5V6l1 1"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M6 10h5M6 13h4"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
		/>
	</svg>,
	// Documents à la main — pile de docs
	<svg key="3" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<rect
			x="6"
			y="5"
			width="10"
			height="13"
			rx="2"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<path
			d="M4 3h10a2 2 0 012 2"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M9 9h4M9 12h3"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
		/>
	</svg>,
	// Aucune piste d'audit — œil barré
	<svg key="4" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<path
			d="M3.5 3.5l13 13"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M6.5 6.8C4.5 8 3 10 3 10s2.5 5 7 5c1.3 0 2.5-.4 3.5-1"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M9 5.1C9.3 5 9.6 5 10 5c4.5 0 7 5 7 5s-.6 1.2-1.8 2.4"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
	// Outils déconnectés — maillon de chaîne cassé
	<svg key="5" width="20" height="20" viewBox="0 0 20 20" fill="none">
		<path
			d="M7.5 12.5L6 14a3.182 3.182 0 01-4.5-4.5l2-2a3.182 3.182 0 014.24 0"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M12.5 7.5L14 6a3.182 3.182 0 014.5 4.5l-2 2a3.182 3.182 0 01-4.24 0"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M9 10.5l0.5 0.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path
			d="M10.5 9l0.5 0.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>,
];

export function Pain({ dict: d }: PainProps) {
	return (
		<section className="bg-tk-surface px-6 py-24">
			<div className="mx-auto max-w-7xl">
				<AnimateIn>
					<div className="mb-14 text-center">
						<h2 className="mb-3 font-display font-extrabold text-[clamp(2rem,4vw,3rem)] text-tk-ink leading-[1.1] tracking-[-0.04em]">
							{d.pain.title}{" "}
							<span className="text-tk-primary italic">{d.pain.title_2}</span>
						</h2>
						<p className="font-body text-[1.0625rem] text-tk-ink-2">
							{d.pain.sub}
						</p>
					</div>
				</AnimateIn>

				<div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
					{d.pain.items.map((item, i) => (
						<AnimateIn key={i} delay={i * 60}>
							<div className="cursor-default rounded-2xl border border-tk-border bg-tk-bg p-6 transition-all duration-200 hover:border-tk-primary hover:shadow-[0_4px_24px_oklch(0.48_0.2_277/0.08)]">
								<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[0.625rem] bg-tk-primary-soft text-tk-primary">
									{icons[i]}
								</div>
								<h3 className="mb-2 font-body font-bold text-base text-tk-ink">
									{item.title}
								</h3>
								<p className="font-body text-[0.9rem] text-tk-ink-2 leading-[1.65]">
									{item.desc}
								</p>
							</div>
						</AnimateIn>
					))}
				</div>

				<AnimateIn mode="scale">
					<div className="relative overflow-hidden rounded-[1.25rem] bg-[linear-gradient(135deg,var(--tk-primary-deep),var(--tk-primary))] p-10 text-center shadow-[0_24px_60px_oklch(0.48_0.2_277/0.25)]">
						<div
							className="absolute inset-0"
							style={{
								backgroundImage:
									"linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
								backgroundSize: "24px 24px",
							}}
						/>
						<div className="relative z-[1]">
							<p className="mb-3 font-display font-extrabold text-[clamp(1.5rem,3vw,2.25rem)] text-white tracking-[-0.03em]">
								{d.pain.highlight}
							</p>
							<p className="font-body text-base text-white/75">
								{d.pain.highlight_sub}
							</p>
						</div>
					</div>
				</AnimateIn>
			</div>
		</section>
	);
}
