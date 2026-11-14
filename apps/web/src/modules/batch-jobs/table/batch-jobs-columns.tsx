import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import type { TFunction } from "i18next";
import { BatchJobStatusBadge } from "../components/batch-job-status-badge";
import type { BatchJobRow } from "../types";

export function getBatchJobsColumns(t: TFunction): ColumnDef<BatchJobRow>[] {
	return [
		{
			id: "type",
			header: t("admin.batchJobs.columns.type"),
			cell: ({ row }) => (
				<span className="font-medium">
					{t(`admin.batchJobs.types.${row.original.type}`, {
						defaultValue: row.original.type,
					})}
				</span>
			),
		},
		{
			id: "status",
			header: t("admin.batchJobs.columns.status"),
			cell: ({ row }) => <BatchJobStatusBadge status={row.original.status} />,
		},
		{
			id: "progress",
			header: t("admin.batchJobs.columns.progress"),
			cell: ({ row: { original: job } }) =>
				job.progress ? (
					<div className="flex items-center gap-2">
						<div className="h-2 w-24 rounded-full bg-gray-200">
							<div
								className="h-2 rounded-full bg-primary-600 transition-all"
								style={{
									width: `${job.progress.itemsTotal > 0 ? (job.progress.itemsProcessed / job.progress.itemsTotal) * 100 : 0}%`,
								}}
							/>
						</div>
						<span className="text-muted-foreground text-xs">
							{job.progress.itemsProcessed}/{job.progress.itemsTotal}
						</span>
					</div>
				) : (
					<span className="text-muted-foreground/60 text-sm">-</span>
				),
		},
		{
			id: "createdBy",
			header: t("admin.batchJobs.columns.createdBy"),
			cell: ({ row: { original: job } }) => (
				<span className="text-sm">
					{job.createdByRef
						? `${job.createdByRef.firstName} ${job.createdByRef.lastName}`
						: "-"}
				</span>
			),
		},
		{
			id: "createdAt",
			header: t("admin.batchJobs.columns.createdAt"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-xs">
					{formatDistanceToNow(new Date(row.original.createdAt), {
						addSuffix: true,
					})}
				</span>
			),
		},
	];
}
