"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { annualLicence, fcfa, PIONEER_DISCOUNT } from "../pricing-2026";

/**
 * The estimator — the page's first interaction.
 *
 * An institution's opening question is arithmetic, not a feature list. Moving
 * the slider answers it before a single paragraph is read, which is what lets
 * the hero carry one sentence instead of sixty words.
 *
 * Every figure comes from `pricing-2026.ts`, transcribed from the commercial
 * proposal and checked against its own worked examples: 200, 350, 400, 800 and
 * 1 500 students all reproduce the printed invoice exactly. The proposal
 * promises that no amount outside its pages can be billed, so a public
 * estimator showing different numbers would break that promise on first click.
 *
 * The administrator count is labelled an assumption because the proposal labels
 * it one: "Remplacez l'hypothese d'administrateurs par la votre" (p. 14).
 */
export function Calculateur({ locale = "fr" }: { locale?: "fr" | "en" }) {
	const sliderId = useId();
	const [students, setStudents] = useState(400);
	const [pioneer, setPioneer] = useState(false);

	const quote = annualLicence(students);
	const total = pioneer
		? Math.round(quote.total * (1 - PIONEER_DISCOUNT))
		: quote.total;
	const perMonth = Math.round(total / students / 12);
	const en = locale === "en";

	return (
		<div className="overflow-hidden rounded-xl border border-tk-border-strong bg-tk-surface shadow-[0_18px_44px_oklch(0.19_0.026_277/0.14)]">
			<div className="px-5 py-5 sm:px-7 sm:py-6">
				<label
					htmlFor={sliderId}
					className="block font-bold font-display text-[1.05rem] text-tk-ink tracking-[-0.02em]"
				>
					{en
						? "How many students do you manage?"
						: "Combien d'étudiants gérez-vous ?"}
				</label>

				<div className="mt-4 flex items-baseline gap-2.5">
					<span className="font-display font-extrabold text-[2.5rem] text-tk-ink tabular-nums leading-none tracking-[-0.04em]">
						{fcfa.format(students)}
					</span>
					<span className="font-body text-[0.9rem] text-tk-muted">
						{en ? "students" : "étudiants"}
					</span>
				</div>

				<input
					id={sliderId}
					type="range"
					min={100}
					max={3000}
					step={50}
					value={students}
					onChange={(e) => setStudents(Number(e.target.value))}
					className="tk-range mt-5 w-full"
				/>
				<div className="mt-1.5 flex justify-between font-code text-[0.65rem] text-tk-muted">
					<span>100</span>
					<span>3 000</span>
				</div>
			</div>

			{/* The payoff block */}
			<div className="relative overflow-hidden bg-tk-primary px-5 py-6 sm:px-7">
				<div
					aria-hidden="true"
					className="tk-field-weave--on-dark pointer-events-none absolute inset-0"
				/>
				<div className="relative">
					<p className="font-code text-[0.65rem] text-tk-on-primary/75 uppercase tracking-[0.14em]">
						{en ? "Your annual licence" : "Votre licence annuelle"}
					</p>
					<p
						aria-live="polite"
						className="mt-2 font-display font-extrabold text-[clamp(1.8rem,1.2rem+2vw,2.5rem)] text-tk-on-primary tabular-nums leading-none tracking-[-0.04em]"
					>
						{fcfa.format(total)}{" "}
						<span className="font-body font-medium text-[0.95rem] tracking-normal">
							{en ? "FCFA excl. tax / year" : "FCFA HT / an"}
						</span>
					</p>
					<p className="mt-2.5 font-body text-[0.8125rem] text-tk-on-primary/85 leading-snug">
						{quote.atFloor
							? en
								? "Minimum tier applied"
								: "Palier minimum appliqué"
							: en
								? "Degressive rate applied"
								: "Barème dégressif appliqué"}
						{" · "}
						{quote.admins}{" "}
						{en ? "admin accounts (assumption)" : "comptes admin (hypothèse)"}
						{" · "}
						{fcfa.format(perMonth)}{" "}
						{en ? "FCFA per student / month" : "FCFA par étudiant et par mois"}
					</p>

					<label className="mt-3.5 inline-flex cursor-pointer items-center gap-2.5">
						<input
							type="checkbox"
							checked={pioneer}
							onChange={(e) => setPioneer(e.target.checked)}
							className="size-4 cursor-pointer accent-tk-accent"
						/>
						<span className="font-body text-[0.8125rem] text-tk-on-primary/90">
							{en ? "Pioneer programme (−10 %)" : "Programme pionniers (−10 %)"}
						</span>
					</label>
				</div>
			</div>

			<div className="grid grid-cols-2 divide-x divide-tk-border border-tk-border border-t">
				<div className="px-5 py-4 sm:px-7">
					<p className="font-display font-extrabold text-[1.45rem] text-tk-eyebrow tabular-nums leading-none">
						0 F
					</p>
					<p className="mt-1.5 font-body text-[0.78rem] text-tk-ink-2 leading-snug">
						{en
							? "onboarding and current year included"
							: "onboarding et année en cours inclus"}
					</p>
				</div>
				<div className="px-5 py-4 sm:px-7">
					<p className="font-display font-extrabold text-[1.45rem] text-tk-eyebrow tabular-nums leading-none">
						400 h
					</p>
					<p className="mt-1.5 font-body text-[0.78rem] text-tk-ink-2 leading-snug">
						{en
							? "of admin work saved per year, for 400 students"
							: "de travail administratif évitées par an, pour 400 étudiants"}
					</p>
				</div>
			</div>

			<div className="border-tk-border border-t px-5 py-3 sm:px-7">
				<Link
					href="/tarifs"
					className="font-body font-medium text-[0.8125rem] text-tk-primary-deep underline-offset-4 hover:underline"
				>
					{en
						? "Every line of this price, explained →"
						: "Chaque ligne de ce prix, expliquée →"}
				</Link>
			</div>
		</div>
	);
}
