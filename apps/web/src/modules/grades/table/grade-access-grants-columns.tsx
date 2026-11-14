import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import type { GradeAccessGrantRow } from "../types";

export function getGradeAccessGrantsColumns(
	t: TFunction,
): ColumnDef<GradeAccessGrantRow>[] {
	return [
		{
			id: "user",
			header: t("admin.gradeAccessGrants.columns.user"),
			cell: ({ row: { original: g } }) => (
				<span className="font-medium">
					{[g.profile.firstName, g.profile.lastName]
						.filter(Boolean)
						.join(" ") || "—"}
					<Badge variant="outline" className="ml-2 text-[10px]">
						{g.profile.role}
					</Badge>
				</span>
			),
		},
		{
			id: "email",
			header: t("admin.gradeAccessGrants.columns.email"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.profile.primaryEmail}
				</span>
			),
		},
		{
			id: "grantedBy",
			header: t("admin.gradeAccessGrants.columns.grantedBy"),
			cell: ({ row: { original: g } }) => (
				<span className="text-muted-foreground text-sm">
					{g.grantedBy
						? [g.grantedBy.firstName, g.grantedBy.lastName]
								.filter(Boolean)
								.join(" ")
						: "—"}
				</span>
			),
		},
		{
			id: "since",
			header: t("admin.gradeAccessGrants.columns.since"),
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
