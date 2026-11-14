import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import { statusVariants } from "../services/deliberation-status";
import type { DeliberationListItem } from "../types";

export function getDeliberationsColumns(
	t: TFunction,
): ColumnDef<DeliberationListItem>[] {
	return [
		{
			id: "class",
			header: t("admin.deliberations.columns.class"),
			cell: ({ row }) => (
				<span className="font-medium">
					{row.original.classRef?.name ?? "—"}
				</span>
			),
		},
		{
			id: "type",
			header: t("admin.deliberations.columns.type"),
			cell: ({ row }) => (
				<Badge variant="outline">
					{t(`admin.deliberations.type.${row.original.type}`)}
				</Badge>
			),
		},
		{
			id: "semester",
			header: t("admin.deliberations.columns.semester"),
			cell: ({ row }) => row.original.semester?.name ?? "—",
		},
		{
			id: "status",
			header: t("admin.deliberations.columns.status"),
			cell: ({ row }) => (
				<Badge variant={statusVariants[row.original.status] ?? "outline"}>
					{t(`admin.deliberations.status.${row.original.status}`)}
				</Badge>
			),
		},
		{
			id: "date",
			header: t("admin.deliberations.columns.date"),
			cell: ({ row }) =>
				row.original.deliberationDate
					? new Date(row.original.deliberationDate).toLocaleDateString()
					: "—",
		},
		{
			id: "createdAt",
			header: t("admin.deliberations.columns.createdAt"),
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
