import { Download, Eye, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import type { useBulkDocumentGeneration } from "../hooks/use-bulk-document-generation";
import { BulkDocumentStudentsTable } from "./bulk-document-students-table";
import { GenerationProgress } from "./generation-progress";

type State = ReturnType<typeof useBulkDocumentGeneration>;

/** Options (ZIP, demo), preview / generate actions and the students of the class. */
export function BulkDocumentStudentsCard({ state }: { state: State }) {
	const {
		studentItems,
		studentsLoading,
		selectedIds,
		zipDownload,
		setZipDownload,
		demoMode,
		setDemoMode,
		previewOne,
		previewFirst,
		handleGenerate,
		isGenerating,
		progress,
		summary,
	} = state;
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between gap-4">
					<div>
						<CardTitle>Étudiants</CardTitle>
						<CardDescription>
							{studentItems.length} étudiant(s) dans cette classe.{" "}
							{selectedIds.size} sélectionné(s).
						</CardDescription>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<Switch
								id="zip"
								checked={zipDownload}
								onCheckedChange={setZipDownload}
							/>
							<Label
								htmlFor="zip"
								className="flex cursor-pointer items-center gap-1 font-normal text-sm"
							>
								<FileArchive className="h-4 w-4" />
								ZIP
							</Label>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								id="demo"
								checked={demoMode}
								onCheckedChange={setDemoMode}
							/>
							<Label
								htmlFor="demo"
								className="cursor-pointer font-normal text-sm"
							>
								Mode démo
							</Label>
						</div>
						<Button
							variant="outline"
							onClick={previewFirst}
							disabled={
								previewOne.isPending ||
								(selectedIds.size === 0 && studentItems.length === 0)
							}
							title="Aperçu du document pour le premier étudiant sélectionné"
						>
							{previewOne.isPending ? (
								<Spinner className="mr-2" />
							) : (
								<Eye className="mr-2 h-4 w-4" />
							)}
							Aperçu
						</Button>
						<Button
							onClick={handleGenerate}
							disabled={isGenerating || selectedIds.size === 0}
						>
							{isGenerating ? (
								<Spinner className="mr-2" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							Générer {selectedIds.size}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{isGenerating && progress.total > 0 && (
					<GenerationProgress
						className="mb-4 space-y-2"
						label="Génération en cours…"
						progress={progress}
						summary={summary}
					/>
				)}

				{studentsLoading ? (
					<div className="flex justify-center py-8">
						<Spinner />
					</div>
				) : studentItems.length === 0 ? (
					<p className="py-8 text-center text-muted-foreground">
						Aucun étudiant dans cette classe.
					</p>
				) : (
					<BulkDocumentStudentsTable state={state} />
				)}
			</CardContent>
		</Card>
	);
}
