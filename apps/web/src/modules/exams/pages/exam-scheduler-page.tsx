import { Play, Zap } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { RunDetailsDialog } from "../components/run-details-dialog";
import { ScheduleExamsDialog } from "../components/schedule-exams-dialog";
import { useSchedulerHistory } from "../hooks/use-exam-scheduler";
import { getSchedulerHistoryColumns } from "../table/scheduler-history-columns";

export default function ExamSchedulerPage() {
	const { t } = useTranslation();
	const { items, isLoading } = useSchedulerHistory();
	const columns = useMemo(
		() =>
			getSchedulerHistoryColumns(t, (item) =>
				RunDetailsDialog.call({ runId: item.id }),
			),
		[t],
	);

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.examScheduler.title")}
					description={t("admin.examScheduler.subtitle")}
					actions={
						<>
							<Button
								variant="outline"
								onClick={() => ScheduleExamsDialog.call({ mode: "retake" })}
							>
								<Zap className="mr-2 h-4 w-4" />
								{t("admin.examScheduler.actions.quickRetakes", {
									defaultValue: "Rattrapages rapides",
								})}
							</Button>
							<Button
								onClick={() => ScheduleExamsDialog.call({ mode: "normal" })}
							>
								<Play className="mr-2 h-4 w-4" />
								{t("admin.examScheduler.actions.schedule")}
							</Button>
						</>
					}
				/>
			}
			toolbar={
				<div>
					<p className="font-semibold">
						{t("admin.examScheduler.history.title")}
					</p>
					<p className="text-muted-foreground text-sm">
						{t("admin.examScheduler.history.description")}
					</p>
				</div>
			}
		>
			<DataTable
				columns={columns}
				data={items}
				isLoading={isLoading}
				empty={
					<Empty>
						<EmptyHeader>
							<EmptyTitle>
								{t("admin.examScheduler.history.emptyTitle")}
							</EmptyTitle>
							<EmptyDescription>
								{t("admin.examScheduler.history.emptyDescription")}
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent />
					</Empty>
				}
			/>
		</ListLayout>
	);
}
