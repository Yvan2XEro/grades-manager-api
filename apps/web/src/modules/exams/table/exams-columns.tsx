import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import type { ExamRow } from "../types";

const STATUS_CLASSES: Record<string, string> = {
	approved:
		"border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100",
	submitted:
		"border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-400/20 dark:text-blue-100",
	rejected:
		"border-red-500 bg-red-50 text-red-700 dark:bg-red-400/20 dark:text-red-100",
};
const DEFAULT_STATUS_CLASS =
	"border-gray-400 bg-muted/50 text-foreground dark:bg-gray-400/20 dark:text-gray-100";

export function getExamsColumns(
	t: TFunction,
	resolveLabels: (
		exam: ExamRow,
		notAvailable: string,
	) => { course: string; class: string },
): ColumnDef<ExamRow>[] {
	const notAvailable = t("common.labels.notAvailable");
	return [
		{
			id: "name",
			header: t("admin.exams.table.name"),
			cell: ({ row: { original: exam } }) => (
				<div className="flex items-center gap-2 font-medium">
					{exam.name}
					{exam.sessionType === "retake" && (
						<Badge
							variant="outline"
							className="border-amber-500 text-amber-600"
						>
							{t("retakes.badge.retake")}
						</Badge>
					)}
				</div>
			),
		},
		{
			id: "course",
			header: t("admin.exams.table.course"),
			cell: ({ row }) => resolveLabels(row.original, notAvailable).course,
		},
		{
			id: "class",
			header: t("admin.exams.table.class"),
			cell: ({ row }) => resolveLabels(row.original, notAvailable).class,
		},
		{
			id: "type",
			header: t("admin.exams.table.type"),
			meta: { className: "w-28" },
			cell: ({ row }) => row.original.type,
		},
		{
			id: "date",
			header: t("admin.exams.table.date"),
			meta: { className: "w-28" },
			cell: ({ row }) => format(new Date(row.original.date), "MMM d, yyyy"),
		},
		{
			id: "percentage",
			header: t("admin.exams.table.percentage"),
			meta: { className: "w-24" },
			cell: ({ row }) => `${row.original.percentage}%`,
		},
		{
			id: "status",
			header: t("admin.exams.table.status"),
			meta: { className: "w-44" },
			cell: ({ row: { original: exam } }) => (
				<>
					<Badge
						variant="outline"
						className={
							STATUS_CLASSES[exam.status ?? ""] ?? DEFAULT_STATUS_CLASS
						}
					>
						{t(`admin.exams.status.${exam.status || "draft"}`)}
					</Badge>
					{exam.isLocked && (
						<Badge
							variant="secondary"
							className="ml-1 bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100"
						>
							{t("admin.exams.status.locked")}
						</Badge>
					)}
				</>
			),
		},
	];
}
