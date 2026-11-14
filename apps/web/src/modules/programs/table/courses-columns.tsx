import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import type { CourseRow } from "../types";

export function getCoursesColumns(
	t: TFunction,
	programNames: Map<string, string>,
	teacherNames: Map<string, string>,
): ColumnDef<CourseRow>[] {
	return [
		{
			id: "code",
			header: t("admin.courses.table.code", { defaultValue: "Code" }),
			meta: { className: "w-[14%]" },
			cell: ({ row }) => (
				<ClipboardCopy
					value={row.original.code}
					label={t("admin.courses.table.code", { defaultValue: "Code" })}
				/>
			),
		},
		{
			id: "name",
			header: t("admin.courses.table.name"),
			meta: { className: "w-[30%]" },
			cell: ({ row }) => (
				<span className="block truncate" title={row.original.name}>
					{row.original.name}
				</span>
			),
		},
		{
			id: "program",
			header: t("admin.courses.table.program"),
			meta: { className: "w-[26%]" },
			cell: ({ row }) => {
				const name = programNames.get(row.original.program);
				return name ? (
					<p className="truncate" title={name}>
						{name}
					</p>
				) : (
					t("common.labels.notAvailable", { defaultValue: "N/A" })
				);
			},
		},
		{
			id: "hours",
			header: t("admin.courses.table.hours"),
			meta: { className: "w-[10%]" },
			cell: ({ row }) => row.original.hours,
		},
		{
			id: "teacher",
			header: t("admin.courses.table.teacher"),
			meta: { className: "w-[20%]" },
			cell: ({ row }) => {
				const name = teacherNames.get(row.original.defaultTeacher ?? "");
				return name ? (
					<span className="block truncate" title={name}>
						{name}
					</span>
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
	];
}
