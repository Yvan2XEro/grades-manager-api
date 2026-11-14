import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";

interface ExportError {
	/** Prefix of the console error. */
	log: string;
	/** i18n key of the toast shown when the error has no message. */
	key: string;
	defaultValue: string;
}

/**
 * Runs one export at a time: `exporting` holds the key of the running export
 * (used for spinners and to disable the other buttons).
 */
export function useExportTask() {
	const { t } = useTranslation();
	const [exporting, setExporting] = useState<string | null>(null);

	const run = async (
		key: string,
		task: () => Promise<void>,
		error: ExportError,
	) => {
		setExporting(key);
		try {
			await task();
		} catch (err) {
			console.error(`${error.log}:`, err);
			toast.error(
				err instanceof Error
					? err.message
					: t(error.key, { defaultValue: error.defaultValue }),
			);
		} finally {
			setExporting(null);
		}
	};

	return { exporting, setExporting, run, isBusy: exporting !== null };
}

export type ExportTask = ReturnType<typeof useExportTask>;

/** Selected year / class / semester of the grade export page. */
export interface ExportFilters {
	selectedYear: string;
	selectedClass: string;
	selectedSemester: string;
	includeRetakes: boolean;
}
