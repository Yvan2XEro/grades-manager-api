import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import type { UeCourse } from "../types";

export function getTeachingUnitCoursesColumns(
	t: TFunction,
	teacherNames: Map<string, string>,
): ColumnDef<UeCourse>[] {
	return [
		{
			id: "code",
			header: t("admin.teachingUnits.courses.table.code", {
				defaultValue: "Code",
			}),
			cell: ({ row }) => (
				<ClipboardCopy
					value={row.original.code}
					label={t("admin.teachingUnits.courses.table.code", {
						defaultValue: "Code",
					})}
				/>
			),
		},
		{
			id: "name",
			header: t("admin.teachingUnits.courses.table.name"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "hours",
			header: t("admin.teachingUnits.courses.table.hours"),
			cell: ({ row }) => row.original.hours,
		},
		{
			id: "teacher",
			header: t("admin.teachingUnits.courses.table.teacher"),
			cell: ({ row }) => teacherNames.get(row.original.defaultTeacher) ?? "—",
		},
		{
			id: "coefficient",
			header: t("admin.teachingUnits.courses.table.coefficient", {
				defaultValue: "Coef.",
			}),
			cell: ({ row }) => row.original.defaultCoefficient,
		},
	];
}
