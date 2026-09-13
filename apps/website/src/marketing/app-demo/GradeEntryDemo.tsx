"use client";

import {
	BookOpen,
	CalendarClock,
	ClipboardList,
	FileSpreadsheet,
	LayoutDashboard,
	ListChecks,
	Save,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n";
import {
	AppBadge,
	AppButton,
	AppCard,
	AppWindow,
	type NavItem,
	Td,
	Th,
	Tr,
} from "./shell";
import { demoSounds } from "./sounds";
import { type DemoStrings, demoStrings } from "./strings";

/**
 * Grade entry — interactive.
 *
 * Change a mark and the weighted average recomputes, the pass/fail chip flips,
 * and the class average at the foot moves with it. That loop is the product's
 * core claim ("zéro erreur de moyenne pondérée", proposal p. 16) demonstrated
 * rather than asserted.
 *
 * Coefficients are the ones the product ships with: continuous assessment 40 %,
 * final exam 60 %, marks out of 20, step 0.25, pass at 10.
 */

/** Icons match the product's own teacher sidebar (apps/web Sidebar.tsx). */
const navFor = (t: DemoStrings): NavItem[] => [
	{ group: t.groups.overview, label: t.nav.dashboard, icon: LayoutDashboard },
	{ group: t.groups.teaching, label: t.nav.courses, icon: BookOpen },
	{ group: t.groups.teaching, label: t.nav.attendance, icon: CalendarClock },
	{
		group: t.groups.assessment,
		label: t.nav.grades,
		icon: FileSpreadsheet,
		active: true,
	},
	{ group: t.groups.assessment, label: t.nav.exams, icon: ClipboardList },
	{ group: t.groups.assessment, label: t.nav.approvals, icon: ListChecks },
];

type Row = {
	id: string;
	matricule: string;
	name: string;
	cc: number;
	exam: number;
};

const INITIAL: Row[] = [
	{
		id: "1",
		matricule: "IS-25-0112",
		name: "FOTSO Jean-Paul",
		cc: 14,
		exam: 12.5,
	},
	{
		id: "2",
		matricule: "IS-25-0198",
		name: "BEKONO Serge",
		cc: 11,
		exam: 12.25,
	},
	{
		id: "3",
		matricule: "IS-25-0275",
		name: "NGANDO Christelle",
		cc: 16,
		exam: 15.5,
	},
	{
		id: "4",
		matricule: "IS-25-0341",
		name: "ABANDA Marie-Claire",
		cc: 15,
		exam: 13.75,
	},
	{
		id: "5",
		matricule: "IS-25-0407",
		name: "DJOMO Aline",
		cc: 9.5,
		exam: 9.25,
	},
];

const CC_WEIGHT = 0.4;
const EXAM_WEIGHT = 0.6;
const PASS = 10;

/** Two decimals with a French comma — the product's own mark format. */
const num = (n: number) => n.toFixed(2).replace(".", ",");

/** Clamp to the product's own 0–20 scale, tolerating a comma decimal. */
function parseMark(raw: string): number | null {
	if (raw.trim() === "") return null;
	const n = Number(raw.replace(",", "."));
	if (Number.isNaN(n)) return null;
	return Math.max(0, Math.min(20, n));
}

export function GradeEntryDemo({
	caption,
	locale,
}: {
	caption?: string;
	/** Drives the application chrome inside the frame. */
	locale?: Locale;
}) {
	const [rows, setRows] = useState<Row[]>(INITIAL);
	const [saved, setSaved] = useState(false);
	const tableId = useId();
	const t = demoStrings(locale);

	const withAverages = useMemo(
		() =>
			rows.map((r) => ({
				...r,
				average: r.cc * CC_WEIGHT + r.exam * EXAM_WEIGHT,
			})),
		[rows],
	);

	const classAverage =
		withAverages.reduce((sum, r) => sum + r.average, 0) / withAverages.length;
	const passing = withAverages.filter((r) => r.average >= PASS).length;

	/**
	 * Entering a mark clicks; a mark that drops the student below the pass line
	 * warns instead, so the sound carries the same information the status chip
	 * does. Silent unless the visitor enabled sound in the frame's header.
	 */
	const update = (id: string, field: "cc" | "exam", raw: string) => {
		const value = parseMark(raw);
		if (value === null) return;

		const next = rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
		const row = next.find((r) => r.id === id);
		const wasPassing =
			(rows.find((r) => r.id === id)?.cc ?? 0) * CC_WEIGHT +
				(rows.find((r) => r.id === id)?.exam ?? 0) * EXAM_WEIGHT >=
			PASS;
		const nowPassing = row
			? row.cc * CC_WEIGHT + row.exam * EXAM_WEIGHT >= PASS
			: true;

		setRows(next);
		setSaved(false);

		if (wasPassing && !nowPassing) demoSounds.warn();
		else demoSounds.click();
	};

	return (
		<figure className="m-0">
			<AppWindow
				url="tkams.com/enseignant/notes"
				breadcrumb={t.chrome.teacher}
				title={t.grades.title}
				nav={navFor(t)}
				locale={locale}
				action={
					<AppButton
						size="sm"
						onClick={() => {
							setSaved(true);
							demoSounds.success();
						}}
						disabled={saved}
					>
						{/* The product's save button carries a 16px Save icon. */}
						<Save className="size-4" aria-hidden="true" />
						{saved ? t.grades.saved : t.grades.save}
					</AppButton>
				}
			>
				<AppCard className="overflow-hidden">
					<div className="flex flex-wrap items-end justify-between gap-3 border-[var(--ap-border)] border-b @md:p-4 p-3">
						<div className="min-w-0">
							<span className="block font-body font-medium text-[0.72rem] text-[var(--ap-fg)]">
								{t.grades.exam}
							</span>
							<span className="mt-1.5 flex h-9 w-full max-w-[22rem] items-center justify-between gap-2 rounded-md border border-[var(--ap-border)] bg-[var(--ap-input)] px-3 font-body text-[0.8125rem] text-[var(--ap-fg)]">
								{t.grades.examValue}
								<span className="opacity-50">⌄</span>
							</span>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<AppBadge tone="muted">{t.grades.weights}</AppBadge>
							<AppBadge tone="outline">{t.grades.scale}</AppBadge>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table
							id={tableId}
							className="w-full caption-bottom border-collapse text-sm"
						>
							<thead className="border-[var(--ap-border)] border-b bg-[var(--ap-muted)]/40">
								<tr>
									<Th>{t.grades.student}</Th>
									<Th align="center">{t.grades.cc}</Th>
									<Th align="center">{t.grades.final}</Th>
									<Th align="right">{t.grades.average}</Th>
									<Th align="right">{t.grades.status}</Th>
								</tr>
							</thead>
							<tbody>
								{withAverages.map((r) => {
									const ok = r.average >= PASS;
									return (
										<Tr key={r.id}>
											<Td>
												<span className="block font-medium leading-tight">
													{r.name}
												</span>
												<span className="block font-code text-[0.68rem] text-[var(--ap-muted-fg)]">
													{r.matricule}
												</span>
											</Td>
											<Td align="center">
												<label
													className="sr-only"
													htmlFor={`${tableId}-cc-${r.id}`}
												>
													{t.grades.ariaCc(r.name)}
												</label>
												<input
													id={`${tableId}-cc-${r.id}`}
													type="number"
													inputMode="decimal"
													min={0}
													max={20}
													step={0.25}
													value={r.cc}
													onChange={(e) => update(r.id, "cc", e.target.value)}
													className="h-8 w-[4.5rem] rounded-md border border-[var(--ap-border)] bg-[var(--ap-input)] px-2 text-center font-body text-[0.8125rem] text-[var(--ap-fg)] tabular-nums outline-none transition-all focus-visible:border-[var(--ap-primary)]/50 focus-visible:ring-[3px] focus-visible:ring-[var(--ap-primary)]/15"
												/>
											</Td>
											<Td align="center">
												<label
													className="sr-only"
													htmlFor={`${tableId}-ex-${r.id}`}
												>
													{t.grades.ariaExam(r.name)}
												</label>
												<input
													id={`${tableId}-ex-${r.id}`}
													type="number"
													inputMode="decimal"
													min={0}
													max={20}
													step={0.25}
													value={r.exam}
													onChange={(e) => update(r.id, "exam", e.target.value)}
													className="h-8 w-[4.5rem] rounded-md border border-[var(--ap-border)] bg-[var(--ap-input)] px-2 text-center font-body text-[0.8125rem] text-[var(--ap-fg)] tabular-nums outline-none transition-all focus-visible:border-[var(--ap-primary)]/50 focus-visible:ring-[3px] focus-visible:ring-[var(--ap-primary)]/15"
												/>
											</Td>
											<Td
												align="right"
												className="font-semibold text-[var(--ap-primary)] tabular-nums"
											>
												{num(r.average)}
											</Td>
											<Td align="right">
												<AppBadge tone={ok ? "success" : "warning"}>
													{ok ? t.grades.passed : t.grades.resit}
												</AppBadge>
											</Td>
										</Tr>
									);
								})}
							</tbody>
						</table>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3 border-[var(--ap-border)] border-t @md:px-4 px-3 py-3">
						<p className="font-body text-[0.75rem] text-[var(--ap-muted-fg)]">
							{t.grades.classAverage}{" "}
							<span className="font-semibold text-[var(--ap-fg)] tabular-nums">
								{num(classAverage)}
							</span>{" "}
							· {t.grades.passingOf(passing, withAverages.length)}
						</p>
						<p
							aria-live="polite"
							className="font-body text-[0.75rem] text-[var(--ap-muted-fg)]"
						>
							{saved ? t.grades.savedHint : t.grades.hint}
						</p>
					</div>
				</AppCard>
			</AppWindow>
			{caption ? (
				<figcaption className="mt-3 font-body text-[0.8125rem] text-tk-muted">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
