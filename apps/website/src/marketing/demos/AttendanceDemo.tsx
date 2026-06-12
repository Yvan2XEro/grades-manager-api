"use client";

import { Bell, Check, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Dict } from "@/i18n";
import { type GhostApi, GhostCursor, useGhostCursor } from "./ghost";

type T = Dict["demos"]["attendance"];
type Row = { id: string; name: string; present: boolean };

const INITIAL: Row[] = [
	{ id: "1", name: "MBARGA Jean", present: true },
	{ id: "2", name: "ATANGANA Rose", present: true },
	{ id: "3", name: "BELLO Fatima", present: true },
	{ id: "4", name: "NKODO Paul", present: true },
	{ id: "5", name: "FOTSO Marie", present: true },
];

export function AttendanceDemo({ t }: { t: T }) {
	const [rows, setRows] = useState<Row[]>(INITIAL);
	const [sent, setSent] = useState(false);

	const toggle = (id: string, present: boolean) => {
		setSent(false);
		setRows((prev) => prev.map((r) => (r.id === id ? { ...r, present } : r)));
	};

	const { rate, absents } = useMemo(() => {
		const a = rows.filter((r) => !r.present).length;
		return {
			absents: a,
			rate: Math.round(((rows.length - a) / rows.length) * 100),
		};
	}, [rows]);

	const containerRef = useRef<HTMLDivElement>(null);
	const { pos, clicking } = useGhostCursor(
		containerRef,
		async (api: GhostApi) => {
			await api.moveTo('[data-cursor="abs-3"]');
			await api.click();
			if (api.cancelled()) return;
			toggle("3", false);
			await api.sleep(500);
			await api.moveTo('[data-cursor="alert"]');
			await api.click();
			if (api.cancelled()) return;
			setSent(true);
		},
	);

	return (
		<div ref={containerRef} className="relative p-4 sm:p-5">
			<GhostCursor pos={pos} clicking={clicking} />
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="font-body font-semibold text-[0.875rem] text-tk-ink">
						{t.title}
					</p>
					<p className="font-code text-[0.75rem] text-tk-muted">{t.subtitle}</p>
				</div>
				<span className="font-code font-semibold text-[0.8125rem] text-tk-primary tabular-nums">
					{t.rate} {rate}%
				</span>
			</div>

			<div className="overflow-hidden rounded-xl border border-tk-border">
				{rows.map((r, i) => (
					<div
						key={r.id}
						className={`flex items-center justify-between px-3.5 py-2.5 ${
							i > 0 ? "border-tk-border/60 border-t" : ""
						} ${r.present ? "" : "bg-[oklch(0.65_0.2_25/0.05)]"}`}
					>
						<span className="font-body font-medium text-[0.8125rem] text-tk-ink">
							{r.name}
						</span>
						<div className="flex gap-1.5">
							<button
								type="button"
								onClick={() => toggle(r.id, true)}
								className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-code font-semibold text-[0.7rem] transition-colors duration-150 ${
									r.present
										? "bg-[oklch(0.58_0.17_149/0.14)] text-tk-accent-emerald"
										: "border border-tk-border text-tk-muted hover:border-tk-accent-emerald"
								}`}
							>
								<Check size={12} /> {t.present}
							</button>
							<button
								type="button"
								data-cursor={`abs-${r.id}`}
								onClick={() => toggle(r.id, false)}
								className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-code font-semibold text-[0.7rem] transition-colors duration-150 ${
									!r.present
										? "bg-[oklch(0.65_0.2_25/0.12)] text-[oklch(0.55_0.2_25)]"
										: "border border-tk-border text-tk-muted hover:border-[oklch(0.65_0.2_25)]"
								}`}
							>
								<X size={12} /> {t.absent}
							</button>
						</div>
					</div>
				))}
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
				<p className="font-code text-[0.72rem] text-tk-muted">
					{absents > 0 ? `${absents} ${t.absent_count}` : t.hint}
				</p>
				<button
					type="button"
					data-cursor="alert"
					onClick={() => setSent(true)}
					disabled={absents === 0}
					className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-body font-semibold text-[0.8125rem] transition-all duration-150 ${
						absents === 0
							? "cursor-not-allowed border border-tk-border text-tk-muted"
							: "bg-tk-primary text-white hover:bg-tk-primary-deep"
					}`}
				>
					{sent ? <Check size={15} /> : <Bell size={15} />}
					{sent ? t.alert_sent : t.alert}
				</button>
			</div>
		</div>
	);
}
