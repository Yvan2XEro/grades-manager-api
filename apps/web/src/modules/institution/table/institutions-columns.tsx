import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { institutionTypeLabel } from "../services/institution-type";
import type { Institution } from "../types";

export function getInstitutionsColumns(t: TFunction): ColumnDef<Institution>[] {
	return [
		{
			id: "code",
			header: t("admin.institutions.table.code", { defaultValue: "Code" }),
			meta: { className: "w-24" },
			cell: ({ row }) => (
				<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
					{row.original.code}
				</span>
			),
		},
		{
			id: "type",
			header: t("admin.institutions.table.type", { defaultValue: "Type" }),
			meta: { className: "w-44" },
			cell: ({ row }) => (
				<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
					{institutionTypeLabel(t, row.original.type)}
				</span>
			),
		},
		{
			id: "nameFr",
			header: t("admin.institutions.table.nameFr", {
				defaultValue: "Name (FR)",
			}),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.nameFr}</span>
			),
		},
		{
			id: "nameEn",
			header: t("admin.institutions.table.nameEn", {
				defaultValue: "Name (EN)",
			}),
			cell: ({ row }) => row.original.nameEn,
		},
		{
			id: "shortName",
			header: t("admin.institutions.table.shortName", {
				defaultValue: "Short name",
			}),
			meta: { className: "w-28" },
			cell: ({ row }) => row.original.shortName || "—",
		},
	];
}
