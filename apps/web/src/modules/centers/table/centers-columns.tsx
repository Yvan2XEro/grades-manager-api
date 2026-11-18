import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Building } from "lucide-react";
import type { CenterRow } from "../types";

export function getCentersColumns(t: TFunction): ColumnDef<CenterRow>[] {
	return [
		{
			id: "logo",
			header: t("admin.centers.table.logo"),
			meta: { className: "w-16" },
			cell: ({ row: { original: center } }) =>
				center.logoUrl ? (
					<img
						src={center.logoUrl}
						alt={center.name}
						className="h-8 w-8 rounded object-contain"
					/>
				) : (
					<div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
						<Building className="h-4 w-4 text-muted-foreground" />
					</div>
				),
		},
		{
			id: "code",
			header: t("admin.centers.table.code"),
			meta: { className: "w-28" },
			cell: ({ row }) => (
				<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
					{row.original.code}
				</span>
			),
		},
		{
			id: "name",
			header: t("admin.centers.table.name"),
			cell: ({ row: { original: center } }) => (
				<div className="font-medium">
					{center.shortName ?? center.name}
					<div className="text-muted-foreground text-xs">{center.name}</div>
				</div>
			),
		},
		{
			id: "city",
			header: t("admin.centers.table.city"),
			cell: ({ row }) => row.original.city || "—",
		},
		{
			id: "country",
			header: t("admin.centers.table.country"),
			cell: ({ row }) => row.original.country || "—",
		},
		{
			id: "status",
			header: t("admin.centers.table.status"),
			cell: ({ row: { original: center } }) => (
				<span
					className={
						center.isActive
							? "inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600 text-xs"
							: "inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs"
					}
				>
					{center.isActive
						? t("common.status.active")
						: t("common.status.inactive")}
				</span>
			),
		},
	];
}
