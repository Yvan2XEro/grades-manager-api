"use client";

import { useMemo, useState } from "react";

type Student = { moy: number; ueMin: number };

const COHORT: Student[] = [
	{ moy: 14.2, ueMin: 11 },
	{ moy: 12.0, ueMin: 9 },
	{ moy: 10.5, ueMin: 6.5 },
	{ moy: 9.8, ueMin: 8 },
	{ moy: 11.3, ueMin: 5.5 },
	{ moy: 8.2, ueMin: 7 },
	{ moy: 13.0, ueMin: 12 },
	{ moy: 7.5, ueMin: 6 },
	{ moy: 10.1, ueMin: 9.5 },
	{ moy: 12.6, ueMin: 4.5 },
];

type Outcome = "admis" | "compense" | "rattrapage" | "ajourne";

function evaluate(
	s: Student,
	seuil: number,
	elim: number,
	compensation: boolean,
): Outcome {
	const passes = s.moy >= seuil;
	const eliminated = s.ueMin < elim;
	if (passes && !eliminated) return "admis";
	if (passes && compensation) return "compense";
	if (s.moy >= seuil - 2) return "rattrapage";
	return "ajourne";
}

const META: Record<Outcome, { label: string; dot: string; text: string }> = {
	admis: {
		label: "Admis",
		dot: "bg-tk-accent-emerald",
		text: "text-tk-accent-emerald",
	},
	compense: {
		label: "Compensés",
		dot: "bg-tk-accent-blue",
		text: "text-tk-accent-blue",
	},
	rattrapage: {
		label: "Rattrapage",
		dot: "bg-[oklch(0.72_0.16_86)]",
		text: "text-[oklch(0.55_0.13_86)]",
	},
	ajourne: {
		label: "Ajournés",
		dot: "bg-[oklch(0.65_0.2_25)]",
		text: "text-[oklch(0.55_0.2_25)]",
	},
};

const rangeCls =
	"h-1.5 w-full cursor-pointer appearance-none rounded-full bg-tk-bg-deep accent-tk-primary";

export function RulesEngineDemo() {
	const [seuil, setSeuil] = useState(10);
	const [elim, setElim] = useState(6);
	const [compensation, setCompensation] = useState(true);

	const counts = useMemo(() => {
		const c: Record<Outcome, number> = {
			admis: 0,
			compense: 0,
			rattrapage: 0,
			ajourne: 0,
		};
		for (const s of COHORT) c[evaluate(s, seuil, elim, compensation)]++;
		return c;
	}, [seuil, elim, compensation]);

	const success = Math.round(
		((counts.admis + counts.compense) / COHORT.length) * 100,
	);

	return (
		<div className="grid grid-cols-1 gap-5 p-4 sm:p-5 md:grid-cols-2">
			{/* Controls */}
			<div className="flex flex-col gap-5">
				<p className="font-code text-[0.7rem] text-tk-muted uppercase tracking-[0.1em]">
					Règles de délibération · cohorte de {COHORT.length}
				</p>

				<div>
					<div className="mb-2 flex items-baseline justify-between">
						<label className="font-body font-medium text-[0.8125rem] text-tk-ink">
							Seuil de validation
						</label>
						<span className="font-code font-semibold text-[0.8125rem] text-tk-primary tabular-nums">
							{seuil.toFixed(1)}/20
						</span>
					</div>
					<input
						type="range"
						min={8}
						max={14}
						step={0.5}
						value={seuil}
						onChange={(e) => setSeuil(Number(e.target.value))}
						className={rangeCls}
						aria-label="Seuil de validation"
					/>
				</div>

				<div>
					<div className="mb-2 flex items-baseline justify-between">
						<label className="font-body font-medium text-[0.8125rem] text-tk-ink">
							Note éliminatoire (UE)
						</label>
						<span className="font-code font-semibold text-[0.8125rem] text-tk-primary tabular-nums">
							{elim === 0 ? "Off" : `${elim.toFixed(1)}/20`}
						</span>
					</div>
					<input
						type="range"
						min={0}
						max={9}
						step={0.5}
						value={elim}
						onChange={(e) => setElim(Number(e.target.value))}
						className={rangeCls}
						aria-label="Note éliminatoire"
					/>
				</div>

				<button
					type="button"
					onClick={() => setCompensation((v) => !v)}
					className="flex items-center justify-between rounded-lg border border-tk-border bg-tk-surface px-3.5 py-2.5 text-left transition-colors duration-150 hover:border-tk-primary"
					aria-pressed={compensation}
				>
					<span>
						<span className="block font-body font-medium text-[0.8125rem] text-tk-ink">
							Compensation entre UE
						</span>
						<span className="block font-code text-[0.7rem] text-tk-muted">
							valide malgré une UE faible
						</span>
					</span>
					<span
						className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
							compensation ? "bg-tk-primary" : "bg-tk-border-strong"
						}`}
					>
						<span
							className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-200 ${
								compensation ? "left-[1.125rem]" : "left-0.5"
							}`}
						/>
					</span>
				</button>
			</div>

			{/* Live results */}
			<div className="flex flex-col justify-between gap-4 rounded-xl border border-tk-border bg-tk-surface p-4">
				<div>
					<div className="flex items-end justify-between">
						<span className="font-code text-[0.7rem] text-tk-muted uppercase tracking-[0.1em]">
							Taux de réussite
						</span>
						<span className="font-display font-extrabold text-[1.75rem] text-tk-ink tabular-nums leading-none">
							{success}%
						</span>
					</div>
					<div className="mt-2 h-2 overflow-hidden rounded-full bg-tk-bg-deep">
						<div
							className="h-full rounded-full bg-[linear-gradient(90deg,var(--tk-accent-emerald),var(--tk-primary-bright))] transition-all duration-500"
							style={{ width: `${success}%` }}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2.5">
					{(Object.keys(META) as Outcome[]).map((k) => (
						<div
							key={k}
							className="flex items-center justify-between rounded-lg border border-tk-border bg-tk-bg px-3 py-2.5"
						>
							<span className="flex items-center gap-2 font-body text-[0.8rem] text-tk-ink-2">
								<span className={`h-2 w-2 rounded-full ${META[k].dot}`} />
								{META[k].label}
							</span>
							<span
								className={`font-display font-extrabold text-[1.125rem] tabular-nums ${META[k].text}`}
							>
								{counts[k]}
							</span>
						</div>
					))}
				</div>

				<p className="font-code text-[0.7rem] text-tk-muted">
					Aucun code modifié — les règles sont des paramètres.
				</p>
			</div>
		</div>
	);
}
