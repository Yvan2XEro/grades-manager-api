import { format } from "date-fns";
import { useMemo } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { DataTable } from "@/components/data-table";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useSchedulerRunDetails } from "../hooks/use-exam-scheduler";
import { getSchedulerRunExamsColumns } from "../table/scheduler-run-exams-columns";

/** Lists the exams created by one scheduler run. */
export const RunDetailsDialog = createCallable<{ runId: string }>(
	({ call, runId }) => {
		const { t } = useTranslation();
		const { details, isLoading } = useSchedulerRunDetails(runId);
		const columns = useMemo(() => getSchedulerRunExamsColumns(t), [t]);

		return (
			<Dialog open={!call.ended} onOpenChange={(open) => !open && call.end()}>
				<DialogContent className="min-w-[80vw] max-w-[90vw]">
					<DialogHeader>
						<DialogTitle>
							{t("admin.examScheduler.history.details.title")}
						</DialogTitle>
					</DialogHeader>
					<DialogBody>
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<Spinner />
							</div>
						) : !details ? (
							<Empty>
								<EmptyHeader>
									<EmptyDescription>
										{t("admin.examScheduler.history.emptyDescription")}
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							<div className="space-y-4">
								<div className="text-muted-foreground text-xs">
									{t("admin.examScheduler.history.details.subtitle", {
										date: format(new Date(details.run.createdAt), "PPp"),
									})}
								</div>
								<DataTable columns={columns} data={details.exams} />
							</div>
						)}
					</DialogBody>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
