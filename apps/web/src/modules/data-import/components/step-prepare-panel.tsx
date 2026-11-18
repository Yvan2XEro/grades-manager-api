import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { G } from "../services/import-steps";
import type { StepSheets } from "../types";
import { FileDropArea } from "./file-drop-area";

/** Explains the step's sheets, gives the pre-filled template and takes the file. */
export function StepPreparePanel({
	step,
	sheets,
	onDownload,
	isDownloading,
	onFile,
	isAnalyzing,
	fileName,
}: {
	/** Step key: its sheet and column help texts are translated by it. */
	step: string;
	sheets: StepSheets;
	onDownload: () => void;
	isDownloading: boolean;
	onFile: (file: File) => void;
	isAnalyzing: boolean;
	fileName: string | null;
}) {
	const { t } = useTranslation();
	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{t(`${G}prepare.downloadTitle`)}
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						{t(`${G}prepare.downloadText`)}
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<Button onClick={onDownload} disabled={isDownloading}>
						{isDownloading ? (
							<Spinner className="mr-2 h-4 w-4" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						{t(`${G}prepare.download`)}
					</Button>
					<div className="space-y-3">
						{sheets.map((sheet, sheetIndex) => (
							<div key={sheet.name} className="rounded-md border p-3">
								<p className="font-medium text-sm">
									{t(`${G}prepare.sheet`, { name: sheet.name })}
								</p>
								<p className="mb-2 text-muted-foreground text-xs">
									{t(`${G}sheetHelp.${step}.${sheetIndex}`, {
										defaultValue: sheet.description,
									})}
								</p>
								<div className="flex flex-wrap gap-1.5">
									{sheet.columns.map((col) => (
										<span
											key={col.key}
											title={[
												col.hint &&
													// Per sheet first: two sheets may share a column key
													t(`${G}columnHelp.${step}.${sheetIndex}.${col.key}`, {
														defaultValue: t(
															`${G}columnHelp.${step}.${col.key}`,
															{
																defaultValue: col.hint,
															},
														),
													}),
												col.enum?.join(" / "),
											]
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
							{t(`${G}prepare.requiredNote`)}
						</p>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{t(`${G}prepare.uploadTitle`)}
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						{t(`${G}prepare.uploadText`)}
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
