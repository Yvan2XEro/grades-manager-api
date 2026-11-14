import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ApiKey } from "../types";

const formatDate = (d: string | Date | null) => {
	if (!d) return "—";
	return new Date(d).toLocaleDateString();
};

export function getApiKeysColumns(t: TFunction): ColumnDef<ApiKey>[] {
	return [
		{
			id: "label",
			header: t("admin.apiKeys.table.label"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2 font-medium">
					<Key className="h-3.5 w-3.5 text-muted-foreground" />
					{row.original.label}
				</div>
			),
		},
		{
			id: "status",
			header: t("admin.apiKeys.table.status"),
			cell: ({ row }) => (
				<Badge variant={row.original.isActive ? "default" : "secondary"}>
					{row.original.isActive
						? t("common.status.active")
						: t("admin.apiKeys.status.revoked")}
				</Badge>
			),
		},
		{
			id: "webhook",
			header: t("admin.apiKeys.table.webhook"),
			cell: ({ row }) =>
				row.original.webhookUrl ? (
					<span className="block max-w-[200px] truncate text-muted-foreground text-xs">
						{row.original.webhookUrl}
					</span>
				) : (
					"—"
				),
		},
		{
			id: "lastUsed",
			header: t("admin.apiKeys.table.lastUsed"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDate(row.original.lastUsedAt)}
				</span>
			),
		},
		{
			id: "created",
			header: t("admin.apiKeys.table.created"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDate(row.original.createdAt)}
				</span>
			),
		},
	];
}
