import { useState } from "react";
import { downloadBase64 } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { BulkExportReportDialog } from "../components/bulk-export-report-dialog";
import type { BulkExportReport, BulkScope } from "../types";
import type { ExportFilters, ExportTask } from "./use-export-task";

type BulkFilters = Parameters<
	typeof trpcClient.exports.bulkExportUes.mutate
>[0];

const BULK_EXPORTS = {
	eval: {
		kind: "Évaluations",
		mutate: (filters: BulkFilters) =>
			trpcClient.exports.bulkExportEvaluations.mutate(filters),
	},
	ec: {
		kind: "EC",
		mutate: (filters: BulkFilters) =>
			trpcClient.exports.bulkExportEcs.mutate(filters),
	},
	ue: {
		kind: "UE",
		mutate: (filters: BulkFilters) =>
			trpcClient.exports.bulkExportUes.mutate(filters),
	},
} as const satisfies Record<string, { kind: BulkExportReport["kind"] }>;

export type BulkExportKind = keyof typeof BULK_EXPORTS;

// ─── Bulk / massive exports ─────────────────────────────────────────
// Generate ZIPs server-side via the dedicated bulk endpoints. The scope
// of "all classes" is implicit when no classId is set in the filters.
// We pass the currently selected academic year / semester / class so the
// user can scope the bulk to "this year only" or "this class only" by
// selecting them, or leave them empty for institution-wide exports.
export function useBulkGradeExports(
	{ selectedYear, selectedClass, selectedSemester }: ExportFilters,
	{ setExporting }: ExportTask,
) {
	const [bulkElapsed, setBulkElapsed] = useState<number>(0); // seconds

	const buildBulkFilters = (scope: BulkScope) => ({
		...(selectedYear ? { academicYearId: selectedYear } : {}),
		...(selectedSemester ? { semesterId: selectedSemester } : {}),
		...(scope === "selected" && selectedClass
			? { classId: selectedClass }
			: {}),
		skipIneligible: true,
	});

	// Start an elapsed-time counter while the bulk export is running. Returns
	// the cleanup function to stop the interval. tRPC mutations don't expose
	// progress, so the elapsed-time counter is the user-facing signal that
	// "things are happening" during long exports.
	const startBulkTimer = () => {
		setBulkElapsed(0);
		const start = Date.now();
		const id = setInterval(() => {
			setBulkElapsed(Math.floor((Date.now() - start) / 1000));
		}, 1000);
		return () => clearInterval(id);
	};

	const bulkExport = async (kind: BulkExportKind, scope: BulkScope) => {
		setExporting(`bulk-${kind}-${scope}`);
		const stopTimer = startBulkTimer();
		try {
			const result = await BULK_EXPORTS[kind].mutate(buildBulkFilters(scope));
			downloadBase64(result.data, result.filename, result.mimeType);
			BulkExportReportDialog.call({
				kind: BULK_EXPORTS[kind].kind,
				total: result.total,
				succeeded: result.succeeded,
				skipped: result.skipped,
				filename: result.filename,
			});
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Bulk export failed",
			);
		} finally {
			stopTimer();
			setExporting(null);
		}
	};

	return { bulkElapsed, bulkExport };
}
