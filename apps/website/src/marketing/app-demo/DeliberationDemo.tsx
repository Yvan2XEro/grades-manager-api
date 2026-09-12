"use client";

import {
	CircleCheck,
	CircleX,
	ClipboardList,
	Gavel,
	GraduationCap,
	LayoutDashboard,
	RotateCcw,
	Settings2,
	TrendingUp,
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
 * Deliberation — interactive, and the page's central proof.
 *
 * The visitor moves the jury's own parameters (pass threshold, eliminating
 * mark, inter-unit compensation) and the whole cohort is re-decided in front of
 * them. That is precisely the claim the commercial proposal makes — "moteur de
 * règles … du brouillon au procès-verbal en trois heures" (p. 06) — and the
 * only honest way to show a rules engine is to let someone turn its dials.
 *
 * The decision logic mirrors the product's LMD rules:
 *   - any unit mark strictly below the eliminating threshold blocks admission,
 *     regardless of the average (unless compensation is enabled and the average
 *     clears the bar);
 *   - average >= threshold -> admitted, with full ECTS;
 *   - average within 2 points below → resit;
 *   - further below → deferred.
 */

/**
 * Icons match the product's own sidebar mapping (apps/web Sidebar.tsx); labels
 * come from the demo strings so the application chrome follows the site's
 * language, exactly as the real bilingual product does.
 */
const navFor = (t: DemoStrings): NavItem[] => [
	{ group: t.groups.overview, label: t.nav.dashboard, icon: LayoutDashboard },
	{ group: t.groups.people, label: t.nav.students, icon: GraduationCap },
	{ group: t.groups.assessment, label: t.nav.grades, icon: ClipboardList },
	{
		group: t.groups.rules,
		label: t.nav.deliberations,
		icon: Gavel,
		active: true,
	},
	{ group: t.groups.rules, label: t.nav.juryRules, icon: Settings2 },
	{ group: t.groups.rules, label: t.nav.promotion, icon: TrendingUp },
];

type Student = {
	matricule: string;
	name: string;
	average: number;
	/** Lowest single unit mark — what an eliminating threshold acts on. */
	lowest: number;
};

const COHORT: Student[] = [
	{
		matricule: "IS-25-0112",
		name: "FOTSO Jean-Paul",
		average: 13.1,
		lowest: 8.5,
	},
	{ matricule: "IS-25-0198", name: "BEKONO Serge", average: 11.8, lowest: 5.5 },
	{
		matricule: "IS-25-0275",
		name: "NGANDO Christelle",
		average: 15.6,
		lowest: 12.0,
	},
	{
		matricule: "IS-25-0341",
		name: "ABANDA Marie-Claire",
		average: 14.25,
		lowest: 9.0,
	},
	{ matricule: "IS-25-0407", name: "DJOMO Aline", average: 9.45, lowest: 7.0 },
	{ matricule: "IS-25-0522", name: "MBALLA Ivan", average: 7.2, lowest: 4.0 },
	{
		matricule: "IS-25-0089",
		name: "TCHOUTA Bernard",
		average: 10.05,
		lowest: 5.75,
	},
	{
		matricule: "IS-25-0634",
		name: "ESSOMBA Nadège",
		average: 12.4,
		lowest: 10.5,
	},
];

type Decision = "admis" | "rattrapage" | "ajourne";

const labelFor = (t: DemoStrings): Record<Decision, string> => ({
	admis: t.delib.admitted,
	rattrapage: t.delib.resit,
	ajourne: t.delib.deferred,
});

const TONE: Record<Decision, "success" | "warning" | "destructive"> = {
	admis: "success",
	rattrapage: "warning",
	ajourne: "destructive",
};

/** Two decimals with a French comma — the product's own mark format. */
const num = (n: number) => n.toFixed(2).replace(".", ",");

function decide(
	s: Student,
	threshold: number,
	eliminating: number,
	compensation: boolean,
	t: DemoStrings,
): { decision: Decision; credits: number; reason: string } {
	const blocked = s.lowest < eliminating;

	if (blocked && !(compensation && s.average >= threshold)) {
		return {
			decision: s.average >= threshold ? "rattrapage" : "ajourne",
			credits: s.average >= threshold ? 24 : 18,
			reason: t.delib.reasons.eliminating(num(s.lowest)),
		};
	}
	if (s.average >= threshold) {
		return {
			decision: "admis",
			credits: 30,
			reason: blocked ? t.delib.reasons.compensated : t.delib.reasons.averageOk,
		};
	}
	if (s.average >= threshold - 2) {
		return {
			decision: "rattrapage",
			credits: 24,
			reason: t.delib.reasons.belowThreshold,
		};
	}
	return {
		decision: "ajourne",
		credits: 18,
		reason: t.delib.reasons.farBelow,
	};
}

export function DeliberationDemo({
	caption,
	locale,
}: {
	caption?: string;
	/** Drives the application chrome inside the frame. */
	locale?: Locale;
}) {
	const [threshold, setThreshold] = useState(10);
	const [eliminating, setEliminating] = useState(6);
	const [compensation, setCompensation] = useState(true);
	const [signed, setSigned] = useState(false);
	const id = useId();

	const t = demoStrings(locale);
	const LABEL = labelFor(t);
	const NAV = navFor(t);

	const results = useMemo(
		() =>
			COHORT.map((s) => ({
				...s,
				...decide(s, threshold, eliminating, compensation, t),
			})),
		[threshold, eliminating, compensation, t],
	);

	const counts = useMemo(
		() => ({
			admis: results.filter((r) => r.decision === "admis").length,
			rattrapage: results.filter((r) => r.decision === "rattrapage").length,
			ajourne: results.filter((r) => r.decision === "ajourne").length,
		}),
		[results],
	);

	/**
	 * Every rule change re-decides the cohort, so it gets the same soft pop the
	 * product plays when a panel updates. Silent unless the visitor turned sound
	 * on from the frame's speaker control.
	 */
	const onRuleChange = (fn: () => void) => {
		fn();
		setSigned(false);
		demoSounds.pop();
	};

	return (
		<figure className="m-0">
			<AppWindow
				url="tkams.com/admin/deliberations"
				breadcrumb={t.chrome.admin}
				title={t.delib.title}
				nav={NAV}
				locale={locale}
				action={
					<AppButton
						size="sm"
						onClick={() => {
							setSigned(true);
							demoSounds.success();
						}}
						disabled={signed}
					>
						<Gavel className="size-4" aria-hidden="true" />
						{signed ? t.delib.signed : t.delib.sign}
					</AppButton>
				}
			>
				{/* Rule controls — the jury's own parameters */}
				<AppCard className="@md:p-4 p-3">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="font-body font-semibold text-[0.82rem] text-[var(--ap-fg)]">
							{t.delib.rulesHeading}
						</p>
						<AppBadge tone={signed ? "success" : "primary"}>
							{signed ? t.delib.closed : t.delib.open}
						</AppBadge>
					</div>

					<div className="mt-3 grid @md:grid-cols-3 gap-4">
						<div>
							<label
								htmlFor={`${id}-threshold`}
								className="block font-body font-medium text-[0.7rem] text-[var(--ap-muted-fg)] uppercase tracking-wide"
							>
								{t.delib.threshold}
							</label>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold font-display text-[1.15rem] text-[var(--ap-fg)] tabular-nums">
									{num(threshold)}
								</span>
								<span className="font-body text-[0.7rem] text-[var(--ap-muted-fg)]">
									/ 20
								</span>
							</div>
							<input
								id={`${id}-threshold`}
								type="range"
								min={8}
								max={14}
								step={0.5}
								value={threshold}
								onChange={(e) =>
									onRuleChange(() => setThreshold(Number(e.target.value)))
								}
								className="tk-range tk-range--app mt-2 w-full"
							/>
						</div>

						<div>
							<label
								htmlFor={`${id}-elim`}
								className="block font-body font-medium text-[0.7rem] text-[var(--ap-muted-fg)] uppercase tracking-wide"
							>
								{t.delib.eliminating}
							</label>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold font-display text-[1.15rem] text-[var(--ap-fg)] tabular-nums">
									{num(eliminating)}
								</span>
								<span className="font-body text-[0.7rem] text-[var(--ap-muted-fg)]">
									/ 20
								</span>
							</div>
							<input
								id={`${id}-elim`}
								type="range"
								min={0}
								max={10}
								step={0.5}
								value={eliminating}
								onChange={(e) =>
									onRuleChange(() => setEliminating(Number(e.target.value)))
								}
								className="tk-range tk-range--app mt-2 w-full"
							/>
						</div>

						<div>
							<span className="block font-body font-medium text-[0.7rem] text-[var(--ap-muted-fg)] uppercase tracking-wide">
								{t.delib.compensation}
							</span>
							<button
								type="button"
								role="switch"
								aria-checked={compensation}
								onClick={() => onRuleChange(() => setCompensation((v) => !v))}
								className="mt-2 inline-flex cursor-pointer items-center gap-2.5 rounded border-none bg-transparent p-0"
							>
								<span
									className={`relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors ${
										compensation
											? "bg-[var(--ap-primary)]"
											: "bg-[var(--ap-border)]"
									}`}
								>
									<span
										className={`absolute size-4 rounded-full bg-white transition-transform ${
											compensation
												? "translate-x-[1.125rem]"
												: "translate-x-0.5"
										}`}
									/>
								</span>
								<span className="font-body text-[0.8125rem] text-[var(--ap-fg)]">
									{compensation ? t.delib.enabled : t.delib.disabled}
								</span>
							</button>
						</div>
					</div>
				</AppCard>

				{/* Counters */}
				<div className="mt-3 grid grid-cols-3 @md:gap-3 gap-2.5">
					{[
						{
							k: t.delib.admitted,
							v: counts.admis,
							tone: "text-emerald-600",
							tile: "bg-emerald-500/10",
							Icon: CircleCheck,
						},
						{
							k: t.delib.resit,
							v: counts.rattrapage,
							tone: "text-amber-600",
							tile: "bg-amber-500/10",
							Icon: RotateCcw,
						},
						{
							k: t.delib.deferred,
							v: counts.ajourne,
							tone: "text-red-600",
							tile: "bg-red-500/10",
							Icon: CircleX,
						},
					].map((c) => (
						<AppCard key={c.k} className="flex items-center gap-3 @md:p-4 p-3">
							{/* KPI icon tile — Dashboard.tsx: h-12 w-12 rounded-2xl, icon h-5 w-5 */}
							<span
								className={`@md:flex hidden size-10 flex-none items-center justify-center rounded-2xl ${c.tile} ${c.tone}`}
							>
								<c.Icon className="size-5" aria-hidden="true" />
							</span>
							<span className="min-w-0">
								<span className="block truncate font-body font-medium text-[0.66rem] text-[var(--ap-muted-fg)] uppercase tracking-wide">
									{c.k}
								</span>
								<span
									className={`block font-bold font-display text-[1.4rem] tabular-nums leading-tight ${c.tone}`}
								>
									{c.v}
								</span>
							</span>
						</AppCard>
					))}
				</div>

				{/* Roster */}
				<AppCard className="mt-3 overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full caption-bottom border-collapse text-sm">
							<thead className="border-[var(--ap-border)] border-b bg-[var(--ap-muted)]/40">
								<tr>
									<Th>{t.delib.student}</Th>
									<Th align="right">{t.delib.average}</Th>
									<Th align="right" className="@md:table-cell hidden">
										{t.delib.lowestMark}
									</Th>
									<Th align="right" className="@lg:table-cell hidden">
										{t.delib.credits}
									</Th>
									<Th align="right">{t.delib.decision}</Th>
								</tr>
							</thead>
							<tbody>
								{results.map((r) => (
									<Tr key={r.matricule}>
										<Td>
											<span className="block font-medium leading-tight">
												{r.name}
											</span>
											<span className="block font-code text-[0.68rem] text-[var(--ap-muted-fg)]">
												{r.matricule}
											</span>
										</Td>
										<Td align="right" className="font-medium tabular-nums">
											{num(r.average)}
										</Td>
										<Td
											align="right"
											className={`@md:table-cell hidden tabular-nums ${
												r.lowest < eliminating
													? "font-semibold text-red-600"
													: ""
											}`}
										>
											{num(r.lowest)}
										</Td>
										<Td
											align="right"
											className="@lg:table-cell hidden tabular-nums"
										>
											{r.credits}
										</Td>
										<Td align="right">
											<span className="inline-flex flex-col items-end gap-0.5">
												<AppBadge tone={TONE[r.decision]}>
													{LABEL[r.decision]}
												</AppBadge>
												<span className="font-body text-[0.62rem] text-[var(--ap-muted-fg)]">
													{r.reason}
												</span>
											</span>
										</Td>
									</Tr>
								))}
							</tbody>
						</table>
					</div>

					<div
						aria-live="polite"
						className="border-[var(--ap-border)] border-t bg-[var(--ap-primary)]/5 @md:px-4 px-3 py-2.5"
					>
						<p className="font-body text-[0.72rem] text-[var(--ap-fg)] leading-relaxed">
							<span className="font-semibold text-[var(--ap-primary)]">
								{t.delib.ruleApplied}
							</span>{" "}
							{t.delib.ruleLine({
								threshold: num(threshold),
								eliminating: num(eliminating),
								compensation,
								count: results.length,
								signed,
							})}
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
