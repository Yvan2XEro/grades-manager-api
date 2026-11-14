import { AlertCircle, CheckCircle2, Files } from "lucide-react";
import { createCallable } from "react-call";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { BulkExportReport } from "../types";

/**
 * Report shown after each bulk ZIP export: generated count and every skipped
 * item with its reason (typically ECs/UEs whose weightings don't sum to 100%).
 */
export const BulkExportReportDialog = createCallable<BulkExportReport>(
	({ call, ...report }) => (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent className="max-h-[85vh] min-w-[60vw] gap-4 overflow-auto p-6">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Files className="h-5 w-5" />
						Rapport d&apos;export — {report.kind}
					</DialogTitle>
					<DialogDescription>
						ZIP téléchargé :{" "}
						<span className="font-mono text-xs">{report.filename}</span>
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="grid grid-cols-3 gap-3">
						<div className="rounded-md border p-3">
							<div className="text-muted-foreground text-xs">
								Total candidats
							</div>
							<div className="font-semibold text-2xl">{report.total}</div>
						</div>
						<div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-900/20">
							<div className="flex items-center gap-1 text-emerald-800 text-xs dark:text-emerald-300">
								<CheckCircle2 className="h-3.5 w-3.5" /> Générés
							</div>
							<div className="font-semibold text-2xl text-emerald-900 dark:text-emerald-200">
								{report.succeeded}
							</div>
						</div>
						<div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/20">
							<div className="flex items-center gap-1 text-amber-800 text-xs dark:text-amber-300">
								<AlertCircle className="h-3.5 w-3.5" /> Ignorés
							</div>
							<div className="font-semibold text-2xl text-amber-900 dark:text-amber-200">
								{report.skipped.length}
							</div>
						</div>
					</div>
					{report.skipped.length > 0 && (
						<div className="rounded-md border">
							<div className="border-b bg-muted/40 px-4 py-2 font-medium text-sm">
								Détail des éléments ignorés
							</div>
							<div className="max-h-[40vh] overflow-auto">
								<table className="w-full text-sm">
									<thead className="sticky top-0 bg-muted/40 text-xs">
										<tr>
											<th className="px-4 py-2 text-left font-medium">ID</th>
											<th className="px-4 py-2 text-left font-medium">
												Raison
											</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{report.skipped.map((s, i) => (
											<tr key={`${s.id}-${i}`} className="hover:bg-muted/30">
												<td className="px-4 py-2 font-mono text-xs">{s.id}</td>
												<td className="px-4 py-2 text-amber-800 dark:text-amber-300">
													{s.reason}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	),
	DIALOG_EXIT_MS,
);
