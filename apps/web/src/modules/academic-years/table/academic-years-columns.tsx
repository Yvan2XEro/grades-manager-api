import type { ColumnDef } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";
import type { TFunction } from "i18next";
import { Switch } from "@/components/ui/switch";
import type { AcademicYearRow } from "../types";

const formatDate = (t: TFunction, dateString: string) => {
	try {
		const date = parseISO(dateString);
		if (!isValid(date)) return t("common.invalidDate");
		return format(date, "MMM d, yyyy");
	} catch {
		return t("common.invalidDate");
	}
};

export function getAcademicYearsColumns(
	t: TFunction,
	onToggleActive: (year: AcademicYearRow) => void,
): ColumnDef<AcademicYearRow>[] {
	return [
		{
			id: "name",
			header: t("admin.academicYears.table.name"),
			cell: ({ row }) => row.original.name,
		},
		{
			id: "startDate",
			header: t("admin.academicYears.table.startDate"),
			cell: ({ row }) => formatDate(t, row.original.startDate),
		},
		{
			id: "endDate",
			header: t("admin.academicYears.table.endDate"),
			cell: ({ row }) => formatDate(t, row.original.endDate),
		},
		{
			id: "status",
			header: t("admin.academicYears.table.status"),
			cell: ({ row: { original: year } }) => (
				<div className="flex items-center gap-3">
					<Switch
						id={`academic-year-${year.id}`}
						checked={year.isActive}
						onCheckedChange={() => onToggleActive(year)}
					/>
					<label
						htmlFor={`academic-year-${year.id}`}
						className="text-muted-foreground text-xs"
					>
						{year.isActive
							? t("common.status.active")
							: t("common.status.inactive")}
					</label>
				</div>
			),
		},
	];
}
