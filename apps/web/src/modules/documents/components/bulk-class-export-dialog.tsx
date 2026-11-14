import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { createCallable } from "react-call";
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
						<DialogTitle>Exporter les listes en lot</DialogTitle>
						<DialogDescription>
							Génère les listes d'étudiants pour les classes sélectionnées — en
							un fichier unique (Excel multi-onglets) ou en un fichier séparé
							par classe (ZIP).
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 px-6 md:grid-cols-2">
						<div className="space-y-1">
							<Label>Format</Label>
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
											Excel (.xlsx)
										</span>
									</SelectItem>
									<SelectItem value="pdf">
										<span className="flex items-center gap-2">
											<FileText className="h-4 w-4" />
											PDF (rendu via template)
										</span>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label>Mode</Label>
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
										Fichier unique
										{format === "pdf" && " (Excel uniquement)"}
									</SelectItem>
									<SelectItem value="separated">
										Fichiers séparés (ZIP)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex flex-1 flex-col overflow-hidden px-6">
						<div className="mb-2 flex items-center justify-between">
							<Label className="text-sm">
								Classes ({selectedIds.size} / {classes.length})
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
												aria-label="Tout sélectionner"
												disabled={isRunning}
											/>
										</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>Nom</TableHead>
										<TableHead>Programme</TableHead>
										<TableHead>Année</TableHead>
										<TableHead className="w-28">Statut</TableHead>
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
							label="Export en cours…"
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
							Fermer
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
							Exporter ({selectedIds.size})
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
