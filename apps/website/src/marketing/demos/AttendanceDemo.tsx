"use client";

import { Bell, Check } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Dict } from "@/i18n";
import { type GhostApi, GhostCursor, useGhostCursor } from "./ghost";

type T = Dict["demos"]["attendance"];
type Row = { id: string; name: string; reg: string; flagged: boolean };

const INITIAL: Row[] = [
	{ id: "1", name: "MBARGA Jean", reg: "INF21-0142", flagged: false },
	{ id: "2", name: "ATANGANA Rose", reg: "INF21-0143", flagged: false },
	{ id: "3", name: "BELLO Fatima", reg: "INF21-0144", flagged: false },
	{ id: "4", name: "NKODO Paul", reg: "INF21-0145", flagged: false },
	{ id: "5", name: "FOTSO Marie", reg: "INF21-0146", flagged: false },
];

export function AttendanceDemo({ t }: { t: T }) {
	const [rows, setRows] = useState<Row[]>(INITIAL);
	const [sent, setSent] = useState(false);

	const toggle = (id: string) => {
		setSent(false);
		setRows((prev) =>
			prev.map((r) => (r.id === id ? { ...r, flagged: !r.flagged } : r)),
		);
	};

	const selected = useMemo(() => rows.filter((r) => r.flagged).length, [rows]);

	const containerRef = useRef<HTMLDivElement>(null);
	const { pos, clicking } = useGhostCursor(
		containerRef,
		async (api: GhostApi) => {
			await api.moveTo('[data-cursor="flag-3"]');
			await api.click();
			if (api.cancelled()) return;
			toggle("3");
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
			</div>

			<div className="overflow-hidden rounded-xl border border-tk-border">
				{rows.map((r, i) => (
					<div
						key={r.id}
						className={`flex items-center justify-between px-3.5 py-2.5 ${
							i > 0 ? "border-tk-border/60 border-t" : ""
						} ${r.flagged ? "bg-[oklch(0.65_0.2_25/0.05)]" : ""}`}
					>
						<div>
							<p className="font-body font-medium text-[0.8125rem] text-tk-ink">
								{r.name}
							</p>
							<p className="font-code text-[0.7rem] text-tk-muted">{r.reg}</p>
						</div>
						<button
							type="button"
							data-cursor={`flag-${r.id}`}
							onClick={() => toggle(r.id)}
							aria-pressed={r.flagged}
							className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-code font-semibold text-[0.7rem] transition-colors duration-150 ${
								r.flagged
									? "bg-[oklch(0.65_0.2_25/0.12)] text-[oklch(0.55_0.2_25)]"
									: "border border-tk-border text-tk-muted hover:border-[oklch(0.65_0.2_25)]"
							}`}
						>
							{r.flagged ? <Check size={12} /> : null}
							{r.flagged ? t.flagged : t.flag}
						</button>
					</div>
				))}
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
				<p className="font-code text-[0.72rem] text-tk-muted">
					{selected > 0 ? `${selected} ${t.selected}` : t.hint}
				</p>
				<button
					type="button"
					data-cursor="alert"
					onClick={() => setSent(true)}
					disabled={selected === 0}
					className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-body font-semibold text-[0.8125rem] transition-all duration-150 ${
						selected === 0
							? "cursor-not-allowed border border-tk-border text-tk-muted"
							: "bg-tk-primary text-white hover:bg-tk-primary-deep"
					}`}
				>
					{sent ? <Check size={15} /> : <Bell size={15} />}
					{sent
						? t.alert_sent
						: `${t.alert}${selected > 0 ? ` (${selected})` : ""}`}
				</button>
			</div>
		</div>
	);
}
