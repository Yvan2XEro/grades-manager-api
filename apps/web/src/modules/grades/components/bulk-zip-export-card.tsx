import { Download, Loader2, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
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

const BULK_KINDS: BulkExportKind[] = ["eval", "ec", "ue"];

/**
 * Bulk export: builds a server-side ZIP holding every PDF
 * (Evaluations, ECs or UEs) sorted by program/class. The scope is:
 *   • "All classes" → the whole institution, filtered by the
 *     academic-year/semester selectors at the top of the page when set.
 *   • "Selected class" → only the chosen class.
 * Ineligible ECs/UEs (weights ≠ 100%) are skipped, with a summary
 * shown in a toast.
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
	const { t } = useTranslation();
	const isBusy = exporting !== null;
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<CardTitle className="flex items-center gap-2 text-base">
							<Package className="h-4 w-4" />
							{t("admin.gradeExport.bulk.title")}
						</CardTitle>
						<CardDescription className="mt-1">
							{t("admin.gradeExport.bulk.description")}
						</CardDescription>
					</div>
					{exporting?.startsWith("bulk-") && (
						<div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-amber-900 text-xs dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
							<span className="font-medium">
								{t("admin.gradeExport.bulk.running", { seconds: bulkElapsed })}
							</span>
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-3 sm:grid-cols-3">
					{BULK_KINDS.map((kind) => (
						<div key={kind} className="rounded-md border p-3">
							<div className="font-medium text-sm">
								{t(`admin.gradeExport.bulk.kinds.${kind}.title`)}
							</div>
							<p className="mt-1 text-muted-foreground text-xs">
								{t(`admin.gradeExport.bulk.kinds.${kind}.description`)}
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
									{t("admin.gradeExport.bulk.allClasses")}
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
									{t("admin.gradeExport.bulk.selectedClass")}
								</Button>
							</div>
						</div>
					))}
				</div>
				<p className="text-muted-foreground text-xs">
					{t("admin.gradeExport.bulk.warning")}
				</p>
			</CardContent>
		</Card>
	);
}
