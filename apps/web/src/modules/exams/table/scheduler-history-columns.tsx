import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { TFunction } from "i18next";
import { TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SchedulerHistoryItem } from "../types";

export function getSchedulerHistoryColumns(
	t: TFunction,
	onView: (item: SchedulerHistoryItem) => void,
): ColumnDef<SchedulerHistoryItem>[] {
	return [
		{
			id: "date",
			header: t("admin.exams.table.date"),
			cell: ({ row }) => format(new Date(row.original.createdAt), "PPp"),
		},
		{
			id: "academicYear",
			header: t("admin.examScheduler.form.academicYearLabel"),
			cell: ({ row }) => row.original.academicYearName ?? "—",
		},
		{
			id: "examType",
			header: t("admin.examScheduler.form.examTypeLabel"),
			cell: ({ row }) => row.original.examTypeName ?? "—",
		},
		{
			id: "percentage",
			header: t("admin.examScheduler.form.percentageLabel"),
			cell: ({ row }) => `${Number(row.original.percentage)}%`,
		},
		{
			id: "classes",
			header: t("admin.examScheduler.history.table.classes"),
			cell: ({ row }) =>
				`${row.original.classCount} / ${row.original.classCourseCount}`,
		},
		{
			id: "created",
			header: t("admin.examScheduler.history.table.created"),
			cell: ({ row }) => row.original.createdCount,
		},
		{
			id: "skipped",
			header: t("admin.examScheduler.history.table.skipped"),
			cell: ({ row }) => row.original.skippedCount,
		},
		{
			id: "duplicates",
			header: t("admin.examScheduler.history.table.duplicates"),
			cell: ({ row }) => row.original.duplicateCount,
		},
		{
			id: "conflicts",
			header: t("admin.examScheduler.history.table.conflicts"),
			cell: ({ row }) => row.original.conflictCount,
		},
		{
			id: "actions",
			header: () => (
				<span className="block text-right">{t("common.table.actions")}</span>
			),
			cell: ({ row }) => (
				<div className="text-right">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onView(row.original)}
					>
						<TableProperties className="mr-2 h-4 w-4" />
						{t("admin.examScheduler.history.actions.view")}
					</Button>
				</div>
			),
		},
	];
}
