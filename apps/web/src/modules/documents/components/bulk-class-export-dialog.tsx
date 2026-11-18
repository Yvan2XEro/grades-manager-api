import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBulkClassExport } from "../hooks/use-bulk-class-export";
import type {
	BulkExportClass,
	BulkExportFormat as Format,
	BulkExportMode as Mode,
} from "../services/bulk-class-export";
import { GenerationProgress } from "./generation-progress";
import { GenerationStatusBadge } from "./generation-status-badge";

interface Props {
	/** Classes pre-filtered by the parent page (filters in effect). */
	classes: BulkExportClass[];
}

/** Exports the student lists of several classes at once. */
export const BulkClassExportDialog = createCallable<Props>(
	({ call, classes }) => {
		const { t } = useTranslation();
		const {
			format,
			setFormat,
			mode,
			setMode,
			selectedIds,
			allSelected,
			toggleAll,
			toggleOne,
			status,
			progress,
			isRunning,
			summary,
			exportMutation,
		} = useBulkClassExport(classes);

		return (
			<Dialog
				open={!call.ended}
				onOpenChange={(open) => !open && !isRunning && call.end()}
			>
				<DialogContent className="flex h-[85vh] max-w-4xl flex-col">
					<DialogHeader>
						<DialogTitle>
							{t("admin.documents.bulkClassExport.title")}
						</DialogTitle>
						<DialogDescription>
							{t("admin.documents.bulkClassExport.description")}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 px-6 md:grid-cols-2">
						<div className="space-y-1">
							<Label>{t("admin.documents.bulkClassExport.format")}</Label>
							<Select
								value={format}
								onValueChange={(v) => setFormat(v as Format)}
								disabled={isRunning}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="xlsx">
										<span className="flex items-center gap-2">
											<FileSpreadsheet className="h-4 w-4" />
											{t("admin.documents.bulkClassExport.formatXlsx")}
										</span>
									</SelectItem>
									<SelectItem value="pdf">
										<span className="flex items-center gap-2">
											<FileText className="h-4 w-4" />
											{t("admin.documents.bulkClassExport.formatPdf")}
										</span>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label>{t("admin.documents.bulkClassExport.mode")}</Label>
							<Select
								value={mode}
								onValueChange={(v) => setMode(v as Mode)}
								disabled={isRunning || format === "pdf"}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="unified" disabled={format === "pdf"}>
										{t("admin.documents.bulkClassExport.unified")}
										{format === "pdf" &&
											t("admin.documents.bulkClassExport.excelOnly")}
									</SelectItem>
									<SelectItem value="separated">
										{t("admin.documents.bulkClassExport.separated")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex flex-1 flex-col overflow-hidden px-6">
						<div className="mb-2 flex items-center justify-between">
							<Label className="text-sm">
								{t("admin.documents.bulkClassExport.classesCount", {
									selected: selectedIds.size,
									total: classes.length,
								})}
							</Label>
						</div>
						<div className="flex-1 overflow-auto rounded border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-10">
											<Checkbox
												checked={allSelected}
												onCheckedChange={toggleAll}
												aria-label={t("admin.documents.bulk.table.selectAll")}
												disabled={isRunning}
											/>
										</TableHead>
										<TableHead>
											{t("admin.documents.bulkClassExport.table.code")}
										</TableHead>
										<TableHead>
											{t("admin.documents.bulkClassExport.table.name")}
										</TableHead>
										<TableHead>
											{t("admin.documents.bulkClassExport.table.program")}
										</TableHead>
										<TableHead>
											{t("admin.documents.bulkClassExport.table.year")}
										</TableHead>
										<TableHead className="w-28">
											{t("admin.documents.bulkClassExport.table.status")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{classes.map((c) => {
										const s = status[c.id];
										return (
											<TableRow key={c.id}>
												<TableCell>
													<Checkbox
														checked={selectedIds.has(c.id)}
														onCheckedChange={() => toggleOne(c.id)}
														disabled={isRunning}
													/>
												</TableCell>
												<TableCell className="font-mono text-xs">
													{c.code}
												</TableCell>
												<TableCell>{c.name}</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{c.program?.name ?? "—"}
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{c.academicYear?.name ?? "—"}
												</TableCell>
												<TableCell>
													<GenerationStatusBadge status={s} />
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</div>

					{isRunning && (
						<GenerationProgress
							className="space-y-2 px-6"
							label={t("admin.documents.bulkClassExport.progress")}
							progress={progress}
							summary={summary}
						/>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => call.end()}
							disabled={isRunning}
						>
							{t("common.actions.close")}
						</Button>
						<Button
							onClick={() => exportMutation.mutate()}
							disabled={isRunning || selectedIds.size === 0}
						>
							{isRunning ? (
								<Spinner className="mr-2" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							{t("admin.documents.bulkClassExport.submit", {
								count: selectedIds.size,
							})}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
