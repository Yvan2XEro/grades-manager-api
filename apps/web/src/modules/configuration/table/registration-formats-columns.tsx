import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import { describeSegment } from "../services/registration-format";
import type { FormatRecord } from "../types";

export function getRegistrationFormatsColumns(
	t: TFunction,
): ColumnDef<FormatRecord>[] {
	return [
		{
			id: "name",
			header: t("admin.registrationNumbers.table.name", {
				defaultValue: "Name",
			}),
			cell: ({ row: { original: format } }) => (
				<div className="flex items-center gap-2 font-medium">
					{format.name}
					{format.isActive && (
						<Badge variant="secondary">
							{t("admin.registrationNumbers.list.active", {
								defaultValue: "Active",
							})}
						</Badge>
					)}
				</div>
			),
		},
		{
			id: "description",
			header: t("admin.registrationNumbers.table.description", {
				defaultValue: "Description",
			}),
			cell: ({ row }) => row.original.description || "-",
		},
		{
			id: "pattern",
			header: t("admin.registrationNumbers.table.pattern", {
				defaultValue: "Pattern",
			}),
			cell: ({ row: { original: format } }) => (
				<div className="flex flex-wrap gap-2 text-foreground text-xs">
					{format.definition.segments.map((segment, idx) => (
						<span
							key={`${format.id}-${idx}`}
							className="rounded bg-muted px-2 py-1"
						>
							{describeSegment(segment)}
						</span>
					))}
				</div>
			),
		},
	];
}
