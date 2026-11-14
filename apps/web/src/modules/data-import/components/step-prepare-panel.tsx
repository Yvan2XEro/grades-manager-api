import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { StepSheets } from "../types";
import { FileDropArea } from "./file-drop-area";

/** Explains the step's sheets, gives the pre-filled template and takes the file. */
export function StepPreparePanel({
	sheets,
	onDownload,
	isDownloading,
	onFile,
	isAnalyzing,
	fileName,
}: {
	sheets: StepSheets;
	onDownload: () => void;
	isDownloading: boolean;
	onFile: (file: File) => void;
	isAnalyzing: boolean;
	fileName: string | null;
}) {
	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">① Télécharger le modèle</CardTitle>
					<p className="text-muted-foreground text-sm">
						Le modèle contient déjà les données existantes : complétez-le,
						corrigez-le si besoin, puis renvoyez-le. Les lignes existantes sont
						mises à jour (repérées par leur code), les nouvelles sont créées.
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<Button onClick={onDownload} disabled={isDownloading}>
						{isDownloading ? (
							<Spinner className="mr-2 h-4 w-4" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Télécharger le modèle pré-rempli
					</Button>
					<div className="space-y-3">
						{sheets.map((sheet) => (
							<div key={sheet.name} className="rounded-md border p-3">
								<p className="font-medium text-sm">Feuille « {sheet.name} »</p>
								<p className="mb-2 text-muted-foreground text-xs">
									{sheet.description}
								</p>
								<div className="flex flex-wrap gap-1.5">
									{sheet.columns.map((col) => (
										<span
											key={col.key}
											title={[col.hint, col.enum?.join(" / ")]
												.filter(Boolean)
												.join(" — ")}
											className={
												col.required
													? "rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs"
													: "rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs"
											}
										>
											{col.header}
											{col.required && " *"}
										</span>
									))}
								</div>
							</div>
						))}
						<p className="text-muted-foreground text-xs">
							* obligatoire. Les listes déroulantes du modèle proposent les
							codes déjà connus.
						</p>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						② Envoyer le fichier rempli
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						Rien n'est enregistré à cette étape : le fichier est d'abord vérifié
						ligne par ligne, puis vous validez l'import.
					</p>
				</CardHeader>
				<CardContent>
					<FileDropArea
						onFile={onFile}
						isBusy={isAnalyzing}
						fileName={fileName}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
