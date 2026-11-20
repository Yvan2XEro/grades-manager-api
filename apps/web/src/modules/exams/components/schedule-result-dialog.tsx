import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import type { SchedulerResult, SchedulingConflict } from "../types";

function useConflictReason() {
	const { t } = useTranslation();
	return (conflict: SchedulingConflict) => {
		switch (conflict.reason) {
			case "noStudents":
				return t("admin.examScheduler.result.reasons.noStudents");
			case "percentageExceeded":
				return t("admin.examScheduler.result.reasons.percentageExceeded", {
					current: conflict.currentPercentage ?? 0,
				});
			default:
				return conflict.message ?? "";
		}
	};
}

/**
 * Outcome of a scheduling run that did not create every exam: how many were
 * created, already existed, and for each course left out, why.
 */
export const ScheduleResultDialog = createCallable<{
	result: SchedulerResult;
}>(({ call, result }) => {
	const { t } = useTranslation();
	const reasonOf = useConflictReason();
	const nothingCreated = result.created === 0;
	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			title={
				nothingCreated
					? t("admin.examScheduler.result.noneTitle")
					: t("admin.examScheduler.result.partialTitle")
			}
		>
			<div className="space-y-4">
				<ul className="space-y-1 text-sm">
					<li className="flex items-center gap-2">
						<CheckCircle2 className="h-4 w-4 text-emerald-600" />
						{t("admin.examScheduler.result.created", {
							count: result.created,
						})}
					</li>
					{result.duplicates > 0 && (
						<li className="text-muted-foreground">
							{t("admin.examScheduler.result.duplicates", {
								count: result.duplicates,
							})}
						</li>
					)}
				</ul>
				{result.conflictDetails.length > 0 && (
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/20">
						<p className="flex items-center gap-2 font-medium text-amber-900 text-sm dark:text-amber-200">
							<AlertTriangle className="h-4 w-4" />
							{t("admin.examScheduler.result.conflictsTitle", {
								count: result.conflictDetails.length,
							})}
						</p>
						<ul className="mt-2 space-y-1.5 text-amber-900 text-sm dark:text-amber-200">
							{result.conflictDetails.map((conflict) => (
								<li key={conflict.classCourseId}>
									<span className="font-medium">
										{conflict.courseName} — {conflict.className}
									</span>
									<span className="block text-amber-800 text-xs dark:text-amber-300">
										{reasonOf(conflict)}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
				<div className="flex justify-end">
					<Button onClick={() => call.end()}>
						{t("common.actions.close")}
					</Button>
				</div>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
