"use client";

import { Check, FileDown, Play, RotateCcw, Table2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/i18n";
import { type GhostApi, GhostCursor, useGhostCursor } from "./ghost";

type T = Dict["demos"]["delib"];
const TOTAL = 10;

export function DeliberationDemo({ t }: { t: T }) {
	const STEPS = t.steps;
	const STATS = [
		{ label: t.admis, value: 7, cls: "text-tk-accent-emerald" },
		{ label: t.compenses, value: 2, cls: "text-tk-accent-blue" },
		{ label: t.ajournes, value: 1, cls: "text-[oklch(0.55_0.2_25)]" },
	];
	const RATE = Math.round(((STATS[0].value + STATS[1].value) / TOTAL) * 100);

	const [step, setStep] = useState(0);
	const [running, setRunning] = useState(false);
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clear = () => {
		for (const ti of timers.current) clearTimeout(ti);
		timers.current = [];
	};
	useEffect(() => clear, []);

	const run = () => {
		clear();
		setRunning(true);
		setStep(0);
		for (let i = 1; i < STEPS.length; i++) {
			timers.current.push(
				setTimeout(() => {
					setStep(i);
					if (i === STEPS.length - 1) setRunning(false);
				}, i * 750),
			);
		}
	};

	const reset = () => {
		clear();
		setRunning(false);
		setStep(0);
	};

	const signed = step === STEPS.length - 1 && !running;

	const containerRef = useRef<HTMLDivElement>(null);
	const { pos, clicking } = useGhostCursor(
		containerRef,
		async (api: GhostApi) => {
			await api.moveTo('[data-cursor="run"]');
			await api.click();
			if (api.cancelled()) return;
			run();
		},
	);

	return (
		<div ref={containerRef} className="relative p-4 sm:p-5">
			<GhostCursor pos={pos} clicking={clicking} />
			<div className="mb-5 flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="font-body font-semibold text-[0.875rem] text-tk-ink">
						{t.title}
					</p>
					<p className="font-code text-[0.75rem] text-tk-muted">
						{t.session} · {TOTAL} {t.students}
					</p>
				</div>
				{signed && (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.58_0.17_149/0.3)] bg-[oklch(0.58_0.17_149/0.1)] px-2.5 py-1 font-code font-semibold text-[0.7rem] text-tk-accent-emerald">
						<Check size={12} /> {t.signed}
					</span>
				)}
			</div>

			{/* Stepper */}
			<div className="flex items-center">
				{STEPS.map((labelStep, i) => {
					const reached = i <= step;
					const current = i === step && running;
					return (
						<div
							key={labelStep}
							className="flex flex-1 items-center last:flex-none"
						>
							<div className="flex flex-col items-center gap-1.5">
								<div
									className={`flex h-8 w-8 items-center justify-center rounded-full font-code font-semibold text-[0.75rem] transition-all duration-300 ${
										reached
											? "bg-tk-primary text-white"
											: "border border-tk-border bg-tk-bg-deep text-tk-muted"
									} ${current ? "ring-4 ring-tk-primary/18" : ""}`}
								>
									{reached && i < step ? <Check size={14} /> : i + 1}
								</div>
								<span
									className={`whitespace-nowrap font-code text-[0.68rem] ${
										reached ? "font-semibold text-tk-ink" : "text-tk-muted"
									}`}
								>
									{labelStep}
								</span>
							</div>
							{i < STEPS.length - 1 && (
								<div className="mx-1 mb-5 h-px flex-1 bg-tk-border">
									<div
										className="h-full bg-tk-primary transition-all duration-500"
										style={{ width: i < step ? "100%" : "0%" }}
									/>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Body */}
			<div className="mt-6 min-h-[7.5rem] rounded-xl border border-tk-border bg-tk-surface p-4">
				{signed ? (
					<div>
						<div className="grid grid-cols-4 gap-2.5">
							<div className="rounded-lg border border-tk-border bg-tk-bg px-3 py-2.5 text-center">
								<p className="font-display font-extrabold text-[1.25rem] text-tk-ink tabular-nums leading-none">
									{RATE}%
								</p>
								<p className="mt-1 font-code text-[0.65rem] text-tk-muted uppercase tracking-[0.06em]">
									{t.rate}
								</p>
							</div>
							{STATS.map((s) => (
								<div
									key={s.label}
									className="rounded-lg border border-tk-border bg-tk-bg px-3 py-2.5 text-center"
								>
									<p
										className={`font-display font-extrabold text-[1.25rem] tabular-nums leading-none ${s.cls}`}
									>
										{s.value}
									</p>
									<p className="mt-1 font-code text-[0.65rem] text-tk-muted uppercase tracking-[0.06em]">
										{s.label}
									</p>
								</div>
							))}
						</div>
						<div className="mt-3 flex flex-wrap gap-2">
							<button
								type="button"
								className="inline-flex items-center gap-2 rounded-lg border border-tk-border bg-tk-bg px-3 py-2 font-body font-medium text-[0.8rem] text-tk-ink-soft transition-colors duration-150 hover:border-tk-primary hover:text-tk-primary"
							>
								<FileDown size={14} /> {t.pv_pdf}
							</button>
							<button
								type="button"
								className="inline-flex items-center gap-2 rounded-lg border border-tk-border bg-tk-bg px-3 py-2 font-body font-medium text-[0.8rem] text-tk-ink-soft transition-colors duration-150 hover:border-tk-primary hover:text-tk-primary"
							>
								<Table2 size={14} /> {t.releves}
							</button>
						</div>
					</div>
				) : (
					<div className="flex h-full flex-col items-center justify-center gap-1 py-4 text-center">
						<p className="font-body text-[0.875rem] text-tk-ink-soft">
							{running ? `${STEPS[step]}${t.running_suffix}` : t.idle}
						</p>
						<p className="font-code text-[0.72rem] text-tk-muted">{t.sub}</p>
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="mt-4 flex flex-wrap items-center gap-2.5">
				<button
					type="button"
					data-cursor="run"
					onClick={run}
					disabled={running}
					className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-body font-semibold text-[0.8125rem] transition-all duration-150 ${
						running
							? "cursor-wait bg-tk-primary/70 text-white"
							: "bg-tk-primary text-white hover:bg-tk-primary-deep"
					}`}
				>
					<Play size={14} /> {running ? t.running : t.run}
				</button>
				{signed && (
					<button
						type="button"
						onClick={reset}
						className="inline-flex items-center gap-2 rounded-lg border border-tk-border px-4 py-2 font-body font-medium text-[0.8125rem] text-tk-ink-soft transition-colors duration-150 hover:border-tk-primary hover:text-tk-primary"
					>
						<RotateCcw size={14} /> {t.replay}
					</button>
				)}
			</div>
		</div>
	);
}
