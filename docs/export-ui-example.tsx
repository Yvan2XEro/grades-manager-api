/**
 * Exemple de composant React pour l'export de notes avec prévisualisation
 *
 * À placer dans apps/web/src/components/exports/
 */

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/utils/trpc";

interface ExportPVProps {
	classId: string;
	semesterId: string;
	academicYearId: string;
	className: string;
}

export function ExportPV({
	classId,
	semesterId,
	academicYearId,
	className,
}: ExportPVProps) {
	const [showPreview, setShowPreview] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	// Preview query
	const { data: htmlPreview, isLoading: isLoadingPreview } =
		trpc.exports.previewPV.useQuery(
			{
				classId,
				semesterId,
				academicYearId,
			},
			{
				enabled: showPreview,
			},
		);

	// Export mutation
	const exportMutation = trpc.exports.generatePV.useMutation({
		onSuccess: (result) => {
			// Convertir base64 en blob et télécharger
			const pdfBlob = base64ToBlob(result.content, result.mimeType);
			const url = URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `PV_${className}_${new Date().toISOString().split("T")[0]}.pdf`;
			link.click();
			URL.revokeObjectURL(url);
			setIsExporting(false);
		},
		onError: (error) => {
			console.error("Erreur lors de l'export:", error);
			setIsExporting(false);
			alert("Erreur lors de l'export du PV");
		},
	});

	const handlePreview = () => {
		setShowPreview(true);
	};

	const handleExportPDF = async () => {
		setIsExporting(true);
		exportMutation.mutate({
			classId,
			semesterId,
			academicYearId,
			format: "pdf",
		});
	};

	return (
		<div className="flex gap-2">
			<Button
				variant="outline"
				onClick={handlePreview}
				disabled={isLoadingPreview}
			>
				{isLoadingPreview ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Chargement...
					</>
				) : (
					"Prévisualiser"
				)}
			</Button>

			<Button onClick={handleExportPDF} disabled={isExporting}>
				{isExporting ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Export en cours...
					</>
				) : (
					"Exporter en PDF"
				)}
			</Button>

			{/* Dialog de prévisualisation */}
			<Dialog open={showPreview} onOpenChange={setShowPreview}>
				<DialogContent className="max-h-[90vh] max-w-7xl overflow-auto">
					<DialogHeader>
						<DialogTitle>Prévisualisation du PV - {className}</DialogTitle>
						<DialogDescription>
							Vérifiez le contenu avant d'exporter en PDF
						</DialogDescription>
					</DialogHeader>

					{isLoadingPreview ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : (
						<div className="overflow-auto rounded-lg border">
							{/* Affichage du HTML en iframe */}
							<iframe
								srcDoc={htmlPreview}
								className="h-[70vh] w-full"
								title="Prévisualisation PV"
							/>
						</div>
					)}

					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setShowPreview(false)}>
							Fermer
						</Button>
						<Button onClick={handleExportPDF} disabled={isExporting}>
							{isExporting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Export...
								</>
							) : (
								"Exporter en PDF"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

/**
 * Composant pour exporter une évaluation
 */
interface ExportEvaluationProps {
	examId: string;
	examName: string;
}

export function ExportEvaluation({ examId, examName }: ExportEvaluationProps) {
	const [showPreview, setShowPreview] = useState(false);
	const [observations, setObservations] = useState("");

	const { data: htmlPreview, isLoading: isLoadingPreview } =
		trpc.exports.previewEvaluation.useQuery(
			{
				examId,
				observations,
			},
			{
				enabled: showPreview,
			},
		);

	const exportMutation = trpc.exports.generateEvaluation.useMutation({
		onSuccess: (result) => {
			const pdfBlob = base64ToBlob(result.content, result.mimeType);
			const url = URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `Evaluation_${examName}_${new Date().toISOString().split("T")[0]}.pdf`;
			link.click();
			URL.revokeObjectURL(url);
		},
		onError: () => {
			alert("Erreur lors de l'export de l'évaluation");
		},
	});

	return (
		<div className="space-y-4">
			<div>
				<label className="mb-2 block font-medium text-sm">
					Observations générales (optionnel)
				</label>
				<textarea
					value={observations}
					onChange={(e) => setObservations(e.target.value)}
					className="min-h-[100px] w-full rounded-md border p-2"
					placeholder="Ajoutez des observations sur le déroulement de l'évaluation..."
				/>
			</div>

			<div className="flex gap-2">
				<Button variant="outline" onClick={() => setShowPreview(true)}>
					Prévisualiser
				</Button>
				<Button
					onClick={() =>
						exportMutation.mutate({ examId, format: "pdf", observations })
					}
				>
					Exporter en PDF
				</Button>
			</div>

			<Dialog open={showPreview} onOpenChange={setShowPreview}>
				<DialogContent className="max-h-[90vh] max-w-7xl overflow-auto">
					<DialogHeader>
						<DialogTitle>Prévisualisation - {examName}</DialogTitle>
					</DialogHeader>

					{isLoadingPreview ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : (
						<iframe
							srcDoc={htmlPreview}
							className="h-[70vh] w-full"
							title="Prévisualisation"
						/>
					)}

					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setShowPreview(false)}>
							Fermer
						</Button>
						<Button
							onClick={() =>
								exportMutation.mutate({ examId, format: "pdf", observations })
							}
						>
							Exporter en PDF
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

/**
 * Composant pour exporter une UE
 */
interface ExportUEProps {
	teachingUnitId: string;
	classId: string;
	semesterId: string;
	academicYearId: string;
	ueName: string;
}

export function ExportUE({
	teachingUnitId,
	classId,
	semesterId,
	academicYearId,
	ueName,
}: ExportUEProps) {
	const [showPreview, setShowPreview] = useState(false);

	const { data: htmlPreview, isLoading: isLoadingPreview } =
		trpc.exports.previewUE.useQuery(
			{
				teachingUnitId,
				classId,
				semesterId,
				academicYearId,
			},
			{
				enabled: showPreview,
			},
		);

	const exportMutation = trpc.exports.generateUE.useMutation({
		onSuccess: (result) => {
			const pdfBlob = base64ToBlob(result.content, result.mimeType);
			const url = URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `UE_${ueName}_${new Date().toISOString().split("T")[0]}.pdf`;
			link.click();
			URL.revokeObjectURL(url);
		},
	});

	return (
		<div className="flex gap-2">
			<Button variant="outline" onClick={() => setShowPreview(true)}>
				Prévisualiser
			</Button>
			<Button
				onClick={() =>
					exportMutation.mutate({
						teachingUnitId,
						classId,
						semesterId,
						academicYearId,
						format: "pdf",
					})
				}
			>
				Exporter en PDF
			</Button>

			<Dialog open={showPreview} onOpenChange={setShowPreview}>
				<DialogContent className="max-h-[90vh] max-w-7xl overflow-auto">
					<DialogHeader>
						<DialogTitle>Prévisualisation UE - {ueName}</DialogTitle>
					</DialogHeader>

					{isLoadingPreview ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : (
						<iframe
							srcDoc={htmlPreview}
							className="h-[70vh] w-full"
							title="Prévisualisation UE"
						/>
					)}

					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setShowPreview(false)}>
							Fermer
						</Button>
						<Button
							onClick={() =>
								exportMutation.mutate({
									teachingUnitId,
									classId,
									semesterId,
									academicYearId,
									format: "pdf",
								})
							}
						>
							Exporter en PDF
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

/**
 * Utilitaire pour convertir base64 en Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
	const byteCharacters = atob(base64);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const byteArray = new Uint8Array(byteNumbers);
	return new Blob([byteArray], { type: mimeType });
}
