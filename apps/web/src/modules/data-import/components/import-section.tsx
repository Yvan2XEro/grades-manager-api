import { Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useImportFlow } from "../hooks/use-import-flow";
import type { ImportType } from "../types";
import { PreviewTable } from "./preview-table";

interface Props {
	type: ImportType;
	prereqHint?: string;
}

export function ImportSection({ type, prereqHint }: Props) {
	const { t } = useTranslation();
	const {
		inputRef,
		templateUrl,
		fileName,
		jobId,
		previewSummary,
		errors,
		warnings,
		summaryEntries,
		hasBlockingErrors,
		isUploading,
		isLoading,
		isRunning,
		selectFile,
		reset,
		run,
	} = useImportFlow(type);

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		selectFile(e.dataTransfer.files[0]);
	}

	return (
		<div className="space-y-5">
			{prereqHint && (
				<p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800 text-sm dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
					{prereqHint}
				</p>
			)}

			{/* Template download */}
			<div className="flex items-center justify-between rounded-lg border p-4">
				<div>
					<p className="font-medium text-sm">Modèle Excel</p>
					<p className="text-muted-foreground text-xs">
						{t("admin.dataImport.uploadZoneAccept")}
					</p>
				</div>
				<Button variant="outline" size="sm" asChild>
					<a href={templateUrl} download>
						<Download className="mr-2 h-4 w-4" />
						{t("admin.dataImport.downloadTemplate")}
					</a>
				</Button>
			</div>

			{/* Drop zone */}
			<div
				className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-accent/30"
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
				role="button"
				tabIndex={0}
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrop}
			>
				<Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
				<p className="text-sm">
					{fileName ? (
						<span className="font-medium">{fileName}</span>
					) : (
						t("admin.dataImport.uploadZone")
					)}
				</p>
				<p className="mt-1 text-muted-foreground text-xs">
					{t("admin.dataImport.uploadZoneAccept")}
				</p>
				<input
					ref={inputRef}
					type="file"
					accept=".xlsx,.csv"
					className="hidden"
					onChange={(e) => selectFile(e.target.files?.[0])}
				/>
			</div>

			{/* Loading */}
			{isLoading && (
				<p className="animate-pulse text-center text-muted-foreground text-sm">
					{isUploading
						? t("admin.dataImport.uploading")
						: t("admin.dataImport.previewing")}
				</p>
			)}

			{/* Preview results */}
			{previewSummary && !isLoading && (
				<div className="space-y-3">
					{summaryEntries.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{summaryEntries.map(([k, v]) => (
								<span
									key={k}
									className="rounded-full border bg-muted px-3 py-0.5 text-xs"
								>
									{k}: <strong>{String(v)}</strong>
								</span>
							))}
						</div>
					)}
					<PreviewTable
						rows={errors}
						label={t("admin.dataImport.preview.errors", {
							count: errors.length,
						})}
						variant="error"
					/>
					<PreviewTable
						rows={warnings}
						label={t("admin.dataImport.preview.warnings", {
							count: warnings.length,
						})}
						variant="warning"
					/>
					{!hasBlockingErrors && (
						<p className="text-green-700 text-sm dark:text-green-400">
							✓ {t("admin.dataImport.preview.noErrors")}
						</p>
					)}
				</div>
			)}

			{/* Actions */}
			{previewSummary && !isLoading && (
				<div className="flex gap-2">
					<Button variant="outline" onClick={reset} size="sm">
						{t("admin.dataImport.newFile")}
					</Button>
					<Button
						onClick={run}
						disabled={hasBlockingErrors || isRunning || !jobId}
						size="sm"
					>
						{hasBlockingErrors
							? t("admin.dataImport.errorBlocker")
							: t("admin.dataImport.confirm")}
					</Button>
				</div>
			)}
		</div>
	);
}
