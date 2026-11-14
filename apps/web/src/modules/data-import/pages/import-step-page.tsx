import { ArrowLeft, PencilLine } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusStepper } from "@/components/ui/status-stepper";
import { StepDonePanel } from "../components/step-done-panel";
import { StepPreparePanel } from "../components/step-prepare-panel";
import { StepReviewPanel } from "../components/step-review-panel";
import { StepStatusBadge } from "../components/step-status-badge";
import { useImportOverview, useSkipStep } from "../hooks/use-import-overview";
import { useImportStep } from "../hooks/use-import-step";
import { FOUNDATION_META, foundationStatus } from "../services/import-steps";

const PHASES = [
	{ key: "prepare", label: "Préparer le fichier" },
	{ key: "review", label: "Vérifier" },
	{ key: "done", label: "Importé" },
];

export default function ImportStepPage() {
	const { step = "" } = useParams<{ step: string }>();
	const { data: overview } = useImportOverview();
	const wizard = useImportStep(step);
	const skip = useSkipStep();

	const steps = overview?.foundations ?? [];
	const index = steps.findIndex((s) => s.key === step);
	const current = steps[index];
	if (overview && !current) return <Navigate to="/import" replace />;
	const meta = FOUNDATION_META[step];
	const previous = steps
		.slice(0, Math.max(index, 0))
		.find((s) => foundationStatus(s) === "todo");
	const next = steps[index + 1];

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			<div className="space-y-4">
				<Button asChild variant="ghost" size="sm" className="-ml-2">
					<Link to="/import">
						<ArrowLeft className="mr-1 h-4 w-4" />
						Import des données
					</Link>
				</Button>
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-1">
						<p className="text-muted-foreground text-xs uppercase tracking-wide">
							Fondations · étape {index + 1}/{steps.length || 3}
						</p>
						<div className="flex items-center gap-2">
							<h1 className="font-semibold text-2xl">
								{current?.label ?? "…"}
							</h1>
							{current && (
								<StepStatusBadge status={foundationStatus(current)} />
							)}
						</div>
						<p className="max-w-2xl text-muted-foreground text-sm">
							{meta?.description}
						</p>
					</div>
					<StatusStepper steps={PHASES} currentStatus={wizard.phase} />
				</div>
				{previous && wizard.phase === "prepare" && (
					<p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-700 text-sm dark:text-amber-400">
						L'étape « {previous.label} » n'est pas encore faite : les références
						vers ses données seront signalées en erreur.{" "}
						<Link
							to={`/import/${previous.key}`}
							className="font-medium underline"
						>
							Y aller
						</Link>
					</p>
				)}
			</div>

			{!wizard.definition ? (
				<Skeleton className="h-80 w-full" />
			) : wizard.phase === "prepare" ? (
				<>
					<StepPreparePanel
						sheets={wizard.definition.sheets}
						onDownload={wizard.downloadTemplate}
						isDownloading={wizard.isDownloading}
						onFile={wizard.selectFile}
						isAnalyzing={wizard.isAnalyzing}
						fileName={wizard.fileName}
					/>
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<span className="text-muted-foreground">Autres options :</span>
						{meta && (
							<Button asChild variant="link" size="sm" className="h-auto px-1">
								<Link to={meta.manualPath}>
									<PencilLine className="mr-1 h-3.5 w-3.5" />
									Saisir manuellement
								</Link>
							</Button>
						)}
						{current && (
							<Button
								variant="link"
								size="sm"
								className="h-auto px-1"
								disabled={skip.isPending}
								onClick={() => skip.mutate({ step, skipped: !current.skipped })}
							>
								{current.skipped
									? "Réactiver cette étape"
									: "Cette étape ne s'applique pas à mon institution"}
							</Button>
						)}
					</div>
				</>
			) : wizard.phase === "review" && wizard.preview ? (
				<StepReviewPanel
					preview={wizard.preview}
					fileName={wizard.fileName}
					errorRowCount={wizard.errorRowCount}
					toImport={wizard.toImport}
					onRun={wizard.run}
					isRunning={wizard.isRunning}
					onRestart={wizard.restart}
				/>
			) : wizard.preview ? (
				<StepDonePanel
					preview={wizard.preview}
					jobId={wizard.jobId}
					nextStep={next}
					onRestart={wizard.restart}
				/>
			) : null}
		</div>
	);
}
