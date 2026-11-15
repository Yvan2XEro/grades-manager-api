import { ArrowLeft, CheckCircle2, Circle, History } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusStepper } from "@/components/ui/status-stepper";
import { useBreadcrumbEntity } from "@/hooks/useBreadcrumbs";
import { cn } from "@/lib/utils";
import { StepDonePanel } from "../components/step-done-panel";
import { StepPreparePanel } from "../components/step-prepare-panel";
import { StepReviewPanel } from "../components/step-review-panel";
import { YearClosePanel } from "../components/year-close-panel";
import { useImportOverview } from "../hooks/use-import-overview";
import { useImportStep } from "../hooks/use-import-step";
import {
	G,
	IMPORT_YEAR_STEPS,
	isPastYear,
	stepLabel,
} from "../services/import-steps";

const PHASES = ["prepare", "review", "done"] as const;

/**
 * Import of one academic year: its steps on the left (in dependency order,
 * with what the year already contains), the current step on the right.
 */
export default function YearImportPage() {
	const { t } = useTranslation();
	const { yearId = "" } = useParams<{ yearId: string }>();
	const [search, setSearch] = useSearchParams();
	const { data: overview } = useImportOverview();
	const year = overview?.years.find((y) => y.id === yearId);
	useBreadcrumbEntity(yearId, year?.name);

	const stepKey =
		IMPORT_YEAR_STEPS.find((s) => s.key === search.get("step"))?.key ??
		IMPORT_YEAR_STEPS.find(
			(s) => year && !s.optional && year.counts[s.count] === 0,
		)?.key ??
		IMPORT_YEAR_STEPS[0].key;
	const index = IMPORT_YEAR_STEPS.findIndex((s) => s.key === stepKey);
	const goTo = (key: string) => setSearch({ step: key }, { replace: true });
	// Pin the step once known: importing changes the counts it is derived from
	const pinned = search.get("step");
	useEffect(() => {
		if (year && !pinned) setSearch({ step: stepKey }, { replace: true });
	}, [year, pinned, stepKey, setSearch]);

	if (overview && !year) return <Navigate to="/import" replace />;
	const past = year ? isPastYear(year) : false;
	const previousMissing = year
		? IMPORT_YEAR_STEPS.slice(0, index).find(
				(s) => !s.optional && year.counts[s.count] === 0,
			)
		: undefined;

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			<div className="space-y-4">
				<Button asChild variant="ghost" size="sm" className="-ml-2">
					<Link to="/import">
						<ArrowLeft className="mr-1 h-4 w-4" />
						{t(`${G}stepPage.back`)}
					</Link>
				</Button>
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="font-semibold text-2xl">
								{t(`${G}yearImport.title`, { year: year?.name ?? "…" })}
							</h1>
							{year && (
								<Badge variant={past ? "secondary" : "default"}>
									{past && <History className="mr-1 h-3 w-3" />}
									{t(`${G}yearImport.kind.${past ? "past" : "current"}`)}
								</Badge>
							)}
						</div>
						<p className="max-w-2xl text-muted-foreground text-sm">
							{t(`${G}yearImport.kindText.${past ? "past" : "current"}`)}
						</p>
					</div>
				</div>
			</div>

			<div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[16rem_1fr]">
				<nav aria-label={t(`${G}yearImport.steps`)} className="space-y-1">
					{IMPORT_YEAR_STEPS.map((step, i) => {
						const count = year?.counts[step.count] ?? 0;
						const active = step.key === stepKey;
						return (
							<button
								key={step.key}
								type="button"
								onClick={() => goTo(step.key)}
								aria-current={active ? "step" : undefined}
								className={cn(
									"flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors",
									active
										? "border-primary bg-primary/5"
										: "border-transparent hover:bg-muted",
								)}
							>
								{count > 0 ? (
									<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
								) : (
									<Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
								)}
								<span className="flex-1">
									<span className="block font-medium">
										{i + 1}. {stepLabel(step.key, t)}
										{step.optional && (
											<span className="ml-1 font-normal text-muted-foreground text-xs">
												({t(`${G}yearImport.optional`)})
											</span>
										)}
									</span>
									<span className="text-muted-foreground text-xs">
										{t(`${G}yearImport.count.${step.key}`, { count })}
									</span>
								</span>
							</button>
						);
					})}
				</nav>

				{year && IMPORT_YEAR_STEPS[index]?.action ? (
					<div className="min-w-0 space-y-4">
						<p className="text-muted-foreground text-sm">
							{t(`${G}stepDescriptions.${stepKey}`, { defaultValue: "" })}
						</p>
						<YearClosePanel
							year={year}
							onNext={() => goTo(IMPORT_YEAR_STEPS[index + 1].key)}
						/>
					</div>
				) : (
					year && (
						<YearStep
							key={stepKey}
							yearId={yearId}
							stepKey={stepKey}
							previousMissing={previousMissing?.key}
							onGoTo={goTo}
						/>
					)
				)}
			</div>
		</div>
	);
}

/** The current step of the year: prepare, review, then done. Keyed by step. */
function YearStep({
	yearId,
	stepKey,
	previousMissing,
	onGoTo,
}: {
	yearId: string;
	stepKey: string;
	previousMissing?: string;
	onGoTo: (key: string) => void;
}) {
	const { t } = useTranslation();
	const wizard = useImportStep(stepKey, yearId);
	const index = IMPORT_YEAR_STEPS.findIndex((s) => s.key === stepKey);
	const next = IMPORT_YEAR_STEPS[index + 1];
	return (
		<div className="min-w-0 space-y-4">
			<StatusStepper
				steps={PHASES.map((key) => ({
					key,
					label: t(`${G}phases.${key}`),
				}))}
				currentStatus={wizard.phase}
			/>
			<p className="text-muted-foreground text-sm">
				{t(`${G}stepDescriptions.${stepKey}`, { defaultValue: "" })}
			</p>
			{previousMissing && wizard.phase === "prepare" && (
				<p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-700 text-sm dark:text-amber-400">
					{t(`${G}stepPage.previousMissing`, {
						label: stepLabel(previousMissing, t),
					})}{" "}
					<button
						type="button"
						onClick={() => onGoTo(previousMissing)}
						className="font-medium underline"
					>
						{t(`${G}stepPage.goThere`)}
					</button>
				</p>
			)}
			{!wizard.definition ? (
				<Skeleton className="h-80 w-full" />
			) : wizard.phase === "prepare" ? (
				<StepPreparePanel
					step={stepKey}
					sheets={wizard.definition.sheets}
					onDownload={wizard.downloadTemplate}
					isDownloading={wizard.isDownloading}
					onFile={wizard.selectFile}
					isAnalyzing={wizard.isAnalyzing}
					fileName={wizard.fileName}
				/>
			) : wizard.phase === "review" && wizard.preview ? (
				<StepReviewPanel
					preview={wizard.preview}
					fileName={wizard.fileName}
					errorRowCount={wizard.errorRowCount}
					toImport={wizard.toImport}
					onRun={wizard.run}
					isRunning={wizard.isRunning}
					onRestart={wizard.restart}
					onDownloadAnnotated={wizard.downloadAnnotated}
					isAnnotating={wizard.isAnnotating}
				/>
			) : wizard.preview ? (
				<StepDonePanel
					preview={wizard.preview}
					jobId={wizard.jobId}
					next={
						next
							? {
									label: t(`${G}done.next`, {
										label: stepLabel(next.key, t),
									}),
									to: `/import/years/${yearId}?step=${next.key}`,
								}
							: { label: t(`${G}done.back`), to: "/import" }
					}
					onRestart={wizard.restart}
				/>
			) : null}
		</div>
	);
}
