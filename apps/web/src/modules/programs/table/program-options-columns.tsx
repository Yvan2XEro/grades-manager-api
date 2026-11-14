import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import type { ProgramOption } from "../types";

export function getProgramOptionsColumns(
	t: TFunction,
): ColumnDef<ProgramOption>[] {
	return [
		{
			id: "name",
			header: t("admin.programs.options.fields.name", {
				defaultValue: "Name",
			}),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "code",
			header: t("admin.programs.options.fields.code", {
				defaultValue: "Code",
			}),
			cell: ({ row }) => row.original.code,
		},
		{
			id: "description",
			header: t("admin.programs.options.fields.description", {
				defaultValue: "Description",
			}),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.description ?? "—"}
				</span>
			),
		},
	];
}
