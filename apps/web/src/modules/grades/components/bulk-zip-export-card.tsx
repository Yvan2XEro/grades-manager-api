import { Download, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { BulkExportKind } from "../hooks/use-bulk-grade-exports";
import type { BulkScope } from "../types";
import { BusyIcon } from "./export-ui";

const BULK_KINDS: Array<{
	kind: BulkExportKind;
	title: string;
	description: string;
}> = [
	{
		kind: "eval",
		title: "Évaluations",
		description: "Une PDF par examen. Aucun check d'éligibilité.",
	},
	{
		kind: "ec",
		title: "EC (Éléments Constitutifs)",
		description: "Une PDF par EC. Skip auto si pondérations ≠ 100%.",
	},
	{
		kind: "ue",
		title: "UE (Unités d'Enseignement)",
		description:
			"Une PDF par UE × classe × semestre. Skip auto si UE incomplète.",
	},
];

/**
 * Export massif : génère un ZIP côté serveur contenant tous les PDFs
 * (Évaluations, EC ou UE) classés par programme/classe. La portée est :
 *   • « Toutes classes » → l'institution entière, filtrée par les
 *     sélecteurs académie/semestre du haut de la page si renseignés.
 *   • « Classe sélectionnée » → uniquement la classe choisie.
 * Les ECs/UEs non éligibles (pondérations ≠ 100%) sont skippés
 * avec un compte-rendu en toast.
 */
export function BulkZipExportCard({
	exporting,
	bulkElapsed,
	hasClass,
	onExport,
}: {
	exporting: string | null;
	bulkElapsed: number;
	hasClass: boolean;
	onExport: (kind: BulkExportKind, scope: BulkScope) => void;
}) {
	const isBusy = exporting !== null;
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<CardTitle className="flex items-center gap-2 text-base">
							<Package className="h-4 w-4" />
							Export massif (ZIP)
						</CardTitle>
						<CardDescription className="mt-1">
							Génère un fichier ZIP contenant tous les PDFs classés par
							programme et classe. Filtré par l&apos;année et le semestre
							sélectionnés en haut de page si renseignés.
						</CardDescription>
					</div>
					{exporting?.startsWith("bulk-") && (
						<div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-amber-900 text-xs dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
							<span className="font-medium">
								Génération en cours · {bulkElapsed}s
							</span>
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-3 sm:grid-cols-3">
					{BULK_KINDS.map(({ kind, title, description }) => (
						<div key={kind} className="rounded-md border p-3">
							<div className="font-medium text-sm">{title}</div>
							<p className="mt-1 text-muted-foreground text-xs">
								{description}
							</p>
							<div className="mt-3 flex flex-col gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={isBusy}
									onClick={() => onExport(kind, "all")}
								>
									<BusyIcon
										busy={exporting === `bulk-${kind}-all`}
										icon={Download}
										className="mr-1 h-3 w-3"
									/>
									Toutes classes
								</Button>
								<Button
									type="button"
									size="sm"
									disabled={!hasClass || isBusy}
									onClick={() => onExport(kind, "selected")}
								>
									<BusyIcon
										busy={exporting === `bulk-${kind}-selected`}
										icon={Download}
										className="mr-1 h-3 w-3"
									/>
									Classe sélectionnée
								</Button>
							</div>
						</div>
					))}
				</div>
				<p className="text-muted-foreground text-xs">
					⚠️ La génération massive peut prendre plusieurs minutes selon le
					volume (1 PDF ≈ 1-2s). Le serveur réutilise un seul navigateur
					Chromium pour accélérer le batch.
				</p>
			</CardContent>
		</Card>
	);
}
