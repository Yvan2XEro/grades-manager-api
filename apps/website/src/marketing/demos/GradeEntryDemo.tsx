"use client";

import { Check, FileText, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Row = { id: string; name: string; reg: string; cc: string; exam: string };

const INITIAL: Row[] = [
	{ id: "1", name: "MBARGA Jean", reg: "INF21-0142", cc: "14", exam: "15" },
	{ id: "2", name: "ATANGANA Rose", reg: "INF21-0143", cc: "11", exam: "11" },
	{ id: "3", name: "BELLO Fatima", reg: "INF21-0144", cc: "9", exam: "6.5" },
	{ id: "4", name: "NKODO Paul", reg: "INF21-0145", cc: "", exam: "" },
	{ id: "5", name: "FOTSO Marie", reg: "INF21-0146", cc: "16", exam: "" },
];

const CC_WEIGHT = 0.4;
const EXAM_WEIGHT = 0.6;

function clamp(v: string): string {
	if (v === "") return "";
	const n = Number(v.replace(",", "."));
	if (Number.isNaN(n)) return "";
	return String(Math.max(0, Math.min(20, n)));
}

function average(r: Row): number | null {
	if (r.cc === "" || r.exam === "") return null;
	return Number(r.cc) * CC_WEIGHT + Number(r.exam) * EXAM_WEIGHT;
}

function decision(avg: number | null) {
	if (avg === null) return { label: "—", cls: "text-tk-muted bg-tk-bg-deep" };
	if (avg >= 10)
		return {
			label: "Validé",
			cls: "text-tk-accent-emerald bg-[oklch(0.58_0.17_149/0.12)]",
		};
	if (avg >= 8)
		return {
			label: "Rattrapage",
			cls: "text-[oklch(0.55_0.13_86)] bg-[oklch(0.72_0.16_86/0.14)]",
		};
	return {
		label: "Ajourné",
		cls: "text-[oklch(0.55_0.2_25)] bg-[oklch(0.65_0.2_25/0.1)]",
	};
}

const scoreInput =
	"w-14 rounded-md border border-tk-border bg-tk-surface px-2 py-1.5 text-center font-code text-[0.8125rem] text-tk-ink tabular-nums outline-none transition-colors duration-150 focus:border-tk-primary focus:ring-2 focus:ring-tk-primary/15";

export function GradeEntryDemo() {
	const [rows, setRows] = useState<Row[]>(INITIAL);
	const [generated, setGenerated] = useState(false);

	const update = (id: string, field: "cc" | "exam", value: string) => {
		setGenerated(false);
		setRows((prev) =>
			prev.map((r) => (r.id === id ? { ...r, [field]: clamp(value) } : r)),
		);
	};

	const { done, classAvg, validated } = useMemo(() => {
		const avgs = rows.map(average);
		const filled = avgs.filter((a): a is number => a !== null);
		return {
			done: filled.length,
			validated: filled.filter((a) => a >= 10).length,
			classAvg: filled.length
				? filled.reduce((s, a) => s + a, 0) / filled.length
				: 0,
		};
	}, [rows]);

	const pct = Math.round((done / rows.length) * 100);

	return (
		<div className="p-4 sm:p-5">
			{/* head */}
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="font-body font-semibold text-[0.875rem] text-tk-ink">
						Licence 3 · Informatique
					</p>
					<p className="font-code text-[0.75rem] text-tk-muted">
						UE Algorithmique · CC 40% + Examen 60%
					</p>
				</div>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.58_0.17_149/0.3)] bg-[oklch(0.58_0.17_149/0.1)] px-2.5 py-1 font-code font-semibold text-[0.7rem] text-tk-accent-emerald">
					<span className="h-1.5 w-1.5 rounded-full bg-tk-accent-emerald" />
					Saisie en cours
				</span>
			</div>

			{/* table */}
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-tk-border border-b text-left">
							<th className="pb-2 font-code text-[0.68rem] text-tk-muted uppercase tracking-[0.08em]">
								Étudiant
							</th>
							<th className="pb-2 text-center font-code text-[0.68rem] text-tk-muted uppercase tracking-[0.08em]">
								CC
							</th>
							<th className="pb-2 text-center font-code text-[0.68rem] text-tk-muted uppercase tracking-[0.08em]">
								Examen
							</th>
							<th className="pb-2 text-center font-code text-[0.68rem] text-tk-muted uppercase tracking-[0.08em]">
								Moyenne
							</th>
							<th className="pb-2 text-right font-code text-[0.68rem] text-tk-muted uppercase tracking-[0.08em]">
								Décision
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => {
							const avg = average(r);
							const d = decision(avg);
							return (
								<tr
									key={r.id}
									className="border-tk-border/60 border-b last:border-0"
								>
									<td className="py-2.5">
										<p className="font-body font-medium text-[0.8125rem] text-tk-ink">
											{r.name}
										</p>
										<p className="font-code text-[0.7rem] text-tk-muted">
											{r.reg}
										</p>
									</td>
									<td className="py-2.5 text-center">
										<input
											type="text"
											inputMode="decimal"
											aria-label={`Note CC ${r.name}`}
											value={r.cc}
											onChange={(e) => update(r.id, "cc", e.target.value)}
											placeholder="—"
											className={scoreInput}
										/>
									</td>
									<td className="py-2.5 text-center">
										<input
											type="text"
											inputMode="decimal"
											aria-label={`Note Examen ${r.name}`}
											value={r.exam}
											onChange={(e) => update(r.id, "exam", e.target.value)}
											placeholder="—"
											className={scoreInput}
										/>
									</td>
									<td className="py-2.5 text-center font-bold font-code text-[0.875rem] text-tk-ink tabular-nums">
										{avg === null ? (
											<span className="text-tk-muted">—</span>
										) : (
											avg.toFixed(2)
										)}
									</td>
									<td className="py-2.5 text-right">
										<span
											className={`inline-block rounded-full px-2.5 py-1 font-code font-semibold text-[0.7rem] ${d.cls}`}
										>
											{d.label}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* footer */}
			<div className="mt-4 border-tk-border border-t pt-4">
				<div className="mb-3 flex items-center justify-between font-code text-[0.72rem] text-tk-muted">
					<span>
						{done}/{rows.length} étudiants traités · {validated} validés
					</span>
					<span>Moyenne classe : {classAvg.toFixed(2)}/20</span>
				</div>
				<div className="h-1.5 overflow-hidden rounded-full bg-tk-bg-deep">
					<div
						className="h-full rounded-full bg-[linear-gradient(90deg,var(--tk-primary),var(--tk-primary-bright))] transition-all duration-500"
						style={{ width: `${pct}%` }}
					/>
				</div>

				<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
					<p className="font-code text-[0.72rem] text-tk-muted">
						💡 Modifie une note — moyenne et décision se recalculent en direct.
					</p>
					<button
						type="button"
						onClick={() => setGenerated(true)}
						disabled={done < rows.length}
						className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-body font-semibold text-[0.8125rem] transition-all duration-150 ${
							done < rows.length
								? "cursor-not-allowed border border-tk-border text-tk-muted"
								: "bg-tk-primary text-white hover:bg-tk-primary-deep"
						}`}
					>
						{generated ? (
							<>
								<Check size={15} /> PV généré
							</>
						) : (
							<>
								<FileText size={15} /> Générer le PV
							</>
						)}
					</button>
				</div>

				{generated && (
					<div className="mt-3 flex items-center gap-2 rounded-lg border border-[oklch(0.58_0.17_149/0.3)] bg-[oklch(0.58_0.17_149/0.08)] px-3 py-2.5 font-body text-[0.8125rem] text-tk-ink">
						<Sparkles size={15} className="text-tk-accent-emerald" />
						PV de délibération généré · {validated} admis sur {rows.length} ·
						prêt à signer.
					</div>
				)}
			</div>
		</div>
	);
}
