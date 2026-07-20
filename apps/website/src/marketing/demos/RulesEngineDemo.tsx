"use client";

import { useMemo, useRef, useState } from "react";
import type { Dict } from "@/i18n";
import { type GhostApi, GhostCursor, useGhostCursor } from "./ghost";

type T = Dict["demos"]["rules"];
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

const STYLE: Record<Outcome, { dot: string; text: string }> = {
	admis: { dot: "bg-tk-accent-emerald", text: "text-tk-accent-emerald" },
	compense: { dot: "bg-tk-accent-blue", text: "text-tk-accent-blue" },
	rattrapage: {
		dot: "bg-[oklch(0.72_0.16_86)]",
		text: "text-[oklch(0.55_0.13_86)]",
	},
	ajourne: {
		dot: "bg-[oklch(0.65_0.2_25)]",
		text: "text-[oklch(0.55_0.2_25)]",
	},
};

const rangeCls =
	"h-1.5 w-full cursor-pointer appearance-none rounded-full bg-tk-bg-deep accent-tk-primary";

export function RulesEngineDemo({ t }: { t: T }) {
	const [seuil, setSeuil] = useState(10);
	const [elim, setElim] = useState(6);
	const [compensation, setCompensation] = useState(true);

	const labelFor: Record<Outcome, string> = {
		admis: t.admis,
		compense: t.compenses,
		rattrapage: t.rattrapage,
		ajourne: t.ajournes,
	};

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

	const containerRef = useRef<HTMLDivElement>(null);
	const { pos, clicking } = useGhostCursor(
		containerRef,
		async (api: GhostApi) => {
			await api.moveTo('[data-cursor="comp"]');
			await api.click();
			if (api.cancelled()) return;
			setCompensation((v) => !v);
		},
	);

	return (
		<div
			ref={containerRef}
			className="relative grid grid-cols-1 gap-5 p-4 sm:p-5 md:grid-cols-2"
		>
			<GhostCursor pos={pos} clicking={clicking} />
			{/* Controls */}
			<div className="flex flex-col gap-5">
				<p className="font-code text-[0.7rem] text-tk-muted uppercase tracking-[0.1em]">
					{t.cohort} {COHORT.length}
				</p>

				<div>
					<div className="mb-2 flex items-baseline justify-between">
						<label className="font-body font-medium text-[0.8125rem] text-tk-ink">
							{t.seuil}
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
						aria-label={t.seuil}
					/>
				</div>

				<div>
					<div className="mb-2 flex items-baseline justify-between">
						<label className="font-body font-medium text-[0.8125rem] text-tk-ink">
							{t.elim}
						</label>
						<span className="font-code font-semibold text-[0.8125rem] text-tk-primary tabular-nums">
							{elim === 0 ? t.off : `${elim.toFixed(1)}/20`}
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
						aria-label={t.elim}
					/>
				</div>

				<button
					type="button"
					data-cursor="comp"
					onClick={() => setCompensation((v) => !v)}
					className="flex items-center justify-between rounded-lg border border-tk-border bg-tk-surface px-3.5 py-2.5 text-left transition-colors duration-150 hover:border-tk-primary"
					aria-pressed={compensation}
				>
					<span>
						<span className="block font-body font-medium text-[0.8125rem] text-tk-ink">
							{t.compensation}
						</span>
						<span className="block font-code text-[0.7rem] text-tk-muted">
							{t.compensation_sub}
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
							{t.success_rate}
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
					{(Object.keys(STYLE) as Outcome[]).map((k) => (
						<div
							key={k}
							className="flex items-center justify-between rounded-lg border border-tk-border bg-tk-bg px-3 py-2.5"
						>
							<span className="flex items-center gap-2 font-body text-[0.8rem] text-tk-ink-2">
								<span className={`h-2 w-2 rounded-full ${STYLE[k].dot}`} />
								{labelFor[k]}
							</span>
							<span
								className={`font-display font-extrabold text-[1.125rem] tabular-nums ${STYLE[k].text}`}
							>
								{counts[k]}
							</span>
						</div>
					))}
				</div>

				<p className="font-code text-[0.7rem] text-tk-muted">{t.note}</p>
			</div>
		</div>
	);
}
