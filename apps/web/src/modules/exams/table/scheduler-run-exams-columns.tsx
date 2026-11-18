import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import type { SchedulerRunExam } from "../types";

export function getSchedulerRunExamsColumns(
	t: TFunction,
): ColumnDef<SchedulerRunExam>[] {
	return [
		{
			id: "exam",
			header: t("admin.examScheduler.history.details.table.exam"),
			cell: ({ row }) => row.original.name,
		},
		{
			id: "course",
			header: t("admin.examScheduler.history.details.table.course"),
			cell: ({ row }) => row.original.courseName ?? "—",
		},
		{
			id: "class",
			header: t("admin.examScheduler.history.details.table.class"),
			cell: ({ row }) => row.original.className ?? "—",
		},
		{
			id: "type",
			header: t("admin.examScheduler.history.details.table.type"),
			cell: ({ row }) => row.original.type,
		},
		{
			id: "date",
			header: t("admin.examScheduler.history.details.table.date"),
			cell: ({ row }) => format(new Date(row.original.date), "PP"),
		},
		{
			id: "status",
			header: t("admin.examScheduler.history.details.table.status"),
			cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
		},
		{
			id: "locked",
			header: t("admin.examScheduler.history.details.table.locked"),
			cell: ({ row }) => (
				<Badge variant={row.original.isLocked ? "default" : "secondary"}>
					{row.original.isLocked
						? t("admin.exams.status.locked")
						: t("admin.exams.status.open")}
				</Badge>
			),
		},
	];
}
