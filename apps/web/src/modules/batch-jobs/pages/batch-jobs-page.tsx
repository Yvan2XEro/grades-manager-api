import { ExternalLink, Play, PlayCircle, Plus, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CreateBatchJobDialog } from "../components/create-batch-job-dialog";
import { useBatchJobListActions, useBatchJobs } from "../hooks/use-batch-jobs";
import { getBatchJobsColumns } from "../table/batch-jobs-columns";
import {
	BATCH_JOB_STATUSES,
	type BatchJobRow,
	CANCELLABLE_STATUSES,
} from "../types";

export default function BatchJobsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const { jobs, isLoading } = useBatchJobs(statusFilter);
	const { runMutation, cancelMutation } = useBatchJobListActions();
	const columns = useMemo(() => getBatchJobsColumns(t), [t]);

	const openJob = (job: BatchJobRow) => navigate(`/batch-jobs/${job.id}`);

	const rowActions = (job: BatchJobRow): RowAction[] => [
		{
			label: t("common.actions.open", { defaultValue: "Open" }),
			icon: ExternalLink,
			onSelect: () => openJob(job),
		},
		...(job.status === "previewed"
			? [
					{
						label: t("admin.batchJobs.actions.run"),
						icon: Play,
						separator: true,
						disabled: runMutation.isPending,
						onSelect: () => runMutation.mutate(job.id),
					},
				]
			: []),
		...(CANCELLABLE_STATUSES.includes(job.status)
			? [
					{
						label: t("admin.batchJobs.actions.cancel"),
						icon: XCircle,
						destructive: true,
						separator: true,
						disabled: cancelMutation.isPending,
						onSelect: () => cancelMutation.mutate(job.id),
					},
				]
			: []),
	];

	return (
		<ListLayout
			header={
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<PlayCircle className="h-6 w-6 text-primary-700" />
						<div>
							<h1 className="text-foreground">{t("admin.batchJobs.title")}</h1>
							<p className="text-muted-foreground text-xs">
								{t("admin.batchJobs.subtitle")}
							</p>
						</div>
					</div>
					<Button onClick={() => CreateBatchJobDialog.call()}>
						<Plus className="mr-2 h-4 w-4" />
						{t("admin.batchJobs.actions.create")}
					</Button>
				</div>
			}
			toolbar={
				<div className="flex items-center gap-3">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							{BATCH_JOB_STATUSES.map((s) => (
								<SelectItem key={s} value={s}>
									{t(`admin.batchJobs.status.${s}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			}
		>
			<DataTable
				columns={columns}
				data={jobs}
				isLoading={isLoading}
				onRowClick={openJob}
				rowActions={rowActions}
				empty={
					<Empty className="m-4 border border-dashed">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<PlayCircle className="text-muted-foreground" />
							</EmptyMedia>
							<EmptyTitle>{t("admin.batchJobs.empty.title")}</EmptyTitle>
							<EmptyDescription>
								{t("admin.batchJobs.empty.description")}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				}
			/>
		</ListLayout>
	);
}
