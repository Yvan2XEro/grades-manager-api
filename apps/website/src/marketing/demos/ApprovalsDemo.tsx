"use client";

import { Check, Sparkles, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Dict } from "@/i18n";
import { type GhostApi, GhostCursor, useGhostCursor } from "./ghost";

type T = Dict["demos"]["approvals"];
type Status = "pending" | "approved" | "rejected";
type Row = { id: string; exam: string; klass: string; status: Status };

const INITIAL: Row[] = [
	{
		id: "1",
		exam: "Algorithmique · Examen",
		klass: "L3 INFO",
		status: "pending",
	},
	{
		id: "2",
		exam: "Bases de données · CC",
		klass: "L3 INFO",
		status: "pending",
	},
	{ id: "3", exam: "Réseaux · Examen", klass: "L2 INFO", status: "pending" },
	{ id: "4", exam: "Statistiques · CC", klass: "L2 ÉCO", status: "pending" },
];

export function ApprovalsDemo({ t }: { t: T }) {
	const [rows, setRows] = useState<Row[]>(INITIAL);

	const set = (id: string, status: Status) => {
		setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
	};
	const approveAll = () => {
		setRows((prev) =>
			prev.map((r) =>
				r.status === "pending" ? { ...r, status: "approved" } : r,
			),
		);
	};

	const counts = useMemo(() => {
		return {
			pending: rows.filter((r) => r.status === "pending").length,
			approved: rows.filter((r) => r.status === "approved").length,
			rejected: rows.filter((r) => r.status === "rejected").length,
		};
	}, [rows]);

	const containerRef = useRef<HTMLDivElement>(null);
	const { pos, clicking } = useGhostCursor(
		containerRef,
		async (api: GhostApi) => {
			await api.moveTo('[data-cursor="ap-1"]');
			await api.click();
			if (api.cancelled()) return;
			set("1", "approved");
			await api.sleep(450);
			await api.moveTo('[data-cursor="rej-3"]');
			await api.click();
			if (api.cancelled()) return;
			set("3", "rejected");
			await api.sleep(450);
			await api.moveTo('[data-cursor="all"]');
			await api.click();
			if (api.cancelled()) return;
			approveAll();
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
				<div className="flex gap-3 font-code text-[0.72rem]">
					<span className="text-tk-muted">
						{counts.pending} {t.pending}
					</span>
					<span className="text-tk-accent-emerald">
						{counts.approved} {t.approved}
					</span>
					<span className="text-[oklch(0.55_0.2_25)]">
						{counts.rejected} {t.rejected}
					</span>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-tk-border">
				{rows.map((r, i) => (
					<div
						key={r.id}
						className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${
							i > 0 ? "border-tk-border/60 border-t" : ""
						}`}
					>
						<div className="min-w-0">
							<p className="truncate font-body font-medium text-[0.8125rem] text-tk-ink">
								{r.exam}
							</p>
							<p className="font-code text-[0.7rem] text-tk-muted">{r.klass}</p>
						</div>
						{r.status === "pending" ? (
							<div className="flex shrink-0 gap-1.5">
								<button
									type="button"
									data-cursor={`ap-${r.id}`}
									onClick={() => set(r.id, "approved")}
									className="inline-flex items-center gap-1 rounded-md bg-[oklch(0.58_0.17_149/0.14)] px-2.5 py-1 font-code font-semibold text-[0.7rem] text-tk-accent-emerald transition-opacity hover:opacity-80"
								>
									<Check size={12} /> {t.approve}
								</button>
								<button
									type="button"
									data-cursor={`rej-${r.id}`}
									onClick={() => set(r.id, "rejected")}
									className="inline-flex items-center gap-1 rounded-md border border-tk-border px-2.5 py-1 font-code font-semibold text-[0.7rem] text-tk-muted transition-colors hover:border-[oklch(0.65_0.2_25)] hover:text-[oklch(0.55_0.2_25)]"
								>
									<X size={12} /> {t.reject}
								</button>
							</div>
						) : (
							<span
								className={`shrink-0 rounded-full px-2.5 py-1 font-code font-semibold text-[0.7rem] ${
									r.status === "approved"
										? "bg-[oklch(0.58_0.17_149/0.14)] text-tk-accent-emerald"
										: "bg-[oklch(0.65_0.2_25/0.1)] text-[oklch(0.55_0.2_25)]"
								}`}
							>
								{r.status === "approved" ? t.approved : t.rejected}
							</span>
						)}
					</div>
				))}
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
				{counts.pending === 0 ? (
					<span className="inline-flex items-center gap-2 font-body text-[0.8125rem] text-tk-ink">
						<Sparkles size={15} className="text-tk-accent-emerald" />
						{t.done}
					</span>
				) : (
					<p className="font-code text-[0.72rem] text-tk-muted">{t.hint}</p>
				)}
				<button
					type="button"
					data-cursor="all"
					onClick={approveAll}
					disabled={counts.pending === 0}
					className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-body font-semibold text-[0.8125rem] transition-all duration-150 ${
						counts.pending === 0
							? "cursor-not-allowed border border-tk-border text-tk-muted"
							: "bg-tk-primary text-white hover:bg-tk-primary-deep"
					}`}
				>
					<Check size={15} /> {t.approve_all}
				</button>
			</div>
		</div>
	);
}
