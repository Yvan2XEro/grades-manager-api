import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export interface CsvColumn {
	key: string;
	label: string;
	required?: boolean;
}

export interface CsvImportDialogProps {
	title: string;
	columns: CsvColumn[];
	onImport: (rows: Record<string, string>[]) => Promise<{ created: number }>;
	templateFilename: string;
	disabled?: boolean;
}

function parseCsv(text: string): Record<string, string>[] {
	const lines = text.trim().split(/\r?\n/);
	if (lines.length < 2) return [];
	const headers = lines[0]
		.split(",")
		.map((h) => h.trim().replace(/^"|"$/g, ""));
	return lines
		.slice(1)
		.filter((l) => l.trim())
		.map((line) => {
			const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
			return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
		});
}

export function CsvImportDialog({
	title,
	columns,
	onImport,
	templateFilename,
	disabled,
}: CsvImportDialogProps) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [rows, setRows] = useState<Record<string, string>[]>([]);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [importing, setImporting] = useState(false);
	const [successCount, setSuccessCount] = useState<number | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const templateCsv =
		"data:text/csv;charset=utf-8," +
		encodeURIComponent(`${columns.map((c) => c.label).join(",")}\n`);

	function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		setValidationError(null);
		setFileError(null);
		setSuccessCount(null);
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result as string;
			try {
				const parsed = parseCsv(text);
				if (parsed.length === 0) {
					setFileError(t("csv_import.no_data", "No data found in file"));
					setRows([]);
					return;
				}
				setRows(parsed);
			} catch {
				setFileError(
					t("csv_import.error_invalid", "Invalid file — check the format"),
				);
				setRows([]);
			}
		};
		reader.readAsText(file);
	}

	function validate() {
		for (const col of columns) {
			if (!col.required) continue;
			const missing = rows.some((r) => !r[col.label]?.trim());
			if (missing) {
				setValidationError(
					t("csv_import.error_missing", 'Column "{{col}}" is required', {
						col: col.label,
					}),
				);
				return false;
			}
		}
		return true;
	}

	async function handleImport() {
		if (!validate()) return;
		setImporting(true);
		try {
			// Map from label-keyed rows to key-keyed rows
			const labelToKey = Object.fromEntries(
				columns.map((c) => [c.label, c.key]),
			);
			const keyedRows = rows.map((row) => {
				const out: Record<string, string> = {};
				for (const [label, key] of Object.entries(labelToKey)) {
					out[key] = row[label] ?? "";
				}
				return out;
			});
			const result = await onImport(keyedRows);
			setSuccessCount(result.created);
			setRows([]);
			if (fileRef.current) fileRef.current.value = "";
		} catch {
			setValidationError(
				t("csv_import.error_invalid", "Invalid file — check the format"),
			);
		} finally {
			setImporting(false);
		}
	}

	function handleOpenChange(next: boolean) {
		if (!next) {
			setRows([]);
			setValidationError(null);
			setFileError(null);
			setSuccessCount(null);
			if (fileRef.current) fileRef.current.value = "";
		}
		setOpen(next);
	}

	const preview = rows.slice(0, 5);

	return (
		<>
			<Button
				variant="outline"
				onClick={() => setOpen(true)}
				disabled={disabled}
				type="button"
			>
				<Upload className="mr-2 h-4 w-4" />
				{t("csv_import.btn", "Import CSV")}
			</Button>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{/* Template download */}
						<div>
							<a
								href={templateCsv}
								download={templateFilename}
								className="text-primary text-sm underline hover:no-underline"
							>
								{t("csv_import.download_template", "Download template")}
							</a>
						</div>

						{/* File input */}
						<div className="space-y-1">
							<Label htmlFor="csv-file-input">
								{t("csv_import.upload_label", "Upload your CSV file")}
							</Label>
							<input
								id="csv-file-input"
								ref={fileRef}
								type="file"
								accept=".csv"
								onChange={handleFile}
								className="block w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:font-medium file:text-sm"
							/>
						</div>

						{fileError && (
							<p className="text-destructive text-sm">{fileError}</p>
						)}

						{/* Preview */}
						{preview.length > 0 && (
							<div className="space-y-2">
								<p className="font-medium text-sm">
									{t("csv_import.preview_title", "Preview (first 5 rows)")}
								</p>
								<div className="overflow-x-auto rounded-md border">
									<table className="w-full text-sm">
										<thead className="bg-muted">
											<tr>
												{columns.map((col) => (
													<th
														key={col.key}
														className="px-3 py-2 text-left font-medium text-muted-foreground text-xs"
													>
														{col.label}
														{col.required && (
															<span className="ml-1 text-destructive">*</span>
														)}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{preview.map((row, i) => (
												<tr key={i} className="border-t">
													{columns.map((col) => (
														<td key={col.key} className="px-3 py-2 text-xs">
															{row[col.label] ?? ""}
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{validationError && (
							<p className="text-destructive text-sm">{validationError}</p>
						)}

						{successCount !== null && (
							<p className="text-green-600 text-sm dark:text-green-400">
								{t(
									"csv_import.success",
									"{{count}} rows created successfully",
									{
										count: successCount,
									},
								)}
							</p>
						)}
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => handleOpenChange(false)}
							type="button"
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button
							onClick={handleImport}
							disabled={rows.length === 0 || importing}
							type="button"
						>
							{importing
								? "..."
								: t("csv_import.import_btn", "Import {{count}} rows", {
										count: rows.length,
									})}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
