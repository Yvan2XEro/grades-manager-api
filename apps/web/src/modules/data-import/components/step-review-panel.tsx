import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { StepPreview } from "../types";
import { IssuesTable } from "./issues-table";

const STATS = [
	{
		key: "create",
		label: "à créer",
		className: "text-emerald-600 dark:text-emerald-400",
	},
	{
		key: "update",
		label: "à mettre à jour",
		className: "text-blue-600 dark:text-blue-400",
	},
	{ key: "unchanged", label: "inchangées", className: "text-muted-foreground" },
	{
		key: "skipped",
		label: "ignorées (erreurs)",
		className: "text-destructive",
	},
] as const;

/** What the import will do, sheet by sheet, and the problems found in the file. */
export function StepReviewPanel({
	preview,
	fileName,
	errorRowCount,
	toImport,
	onRun,
	isRunning,
	onRestart,
}: {
	preview: StepPreview;
	fileName: string | null;
	errorRowCount: number;
	toImport: number;
	onRun: () => void;
	isRunning: boolean;
	onRestart: () => void;
}) {
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{preview.sheets.map((sheet) => (
					<div key={sheet.sheet} className="rounded-lg border bg-card p-4">
						<p className="mb-2 font-medium text-sm">
							Feuille « {sheet.sheet} »
						</p>
						<dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
							{STATS.map((stat) => (
								<div key={stat.key} className="flex items-baseline gap-1.5">
									<dt
										className={`font-semibold tabular-nums ${stat.className}`}
									>
										{sheet[stat.key]}
									</dt>
									<dd className="text-muted-foreground text-xs">
										{stat.label}
									</dd>
								</div>
							))}
						</dl>
					</div>
				))}
			</div>

			{errorRowCount > 0 ? (
				<div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
					<AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
					<p>
						<strong>{errorRowCount} ligne(s) contiennent des erreurs</strong> et
						ne seront pas importées. Corrigez-les dans{" "}
						{fileName ?? "le fichier"} puis renvoyez-le, ou importez dès
						maintenant les lignes valides.
					</p>
				</div>
			) : (
				<div className="flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
					<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
					<p>Le fichier ne contient aucune erreur.</p>
				</div>
			)}

			<IssuesTable issues={preview.issues} />

			<div className="flex flex-wrap justify-end gap-2">
				<Button variant="outline" onClick={onRestart} disabled={isRunning}>
					Envoyer un autre fichier
				</Button>
				<Button onClick={onRun} disabled={isRunning || toImport === 0}>
					{isRunning && <Spinner className="mr-2 h-4 w-4" />}
					{toImport === 0 ? "Rien à importer" : `Importer ${toImport} ligne(s)`}
				</Button>
			</div>
		</div>
	);
}
