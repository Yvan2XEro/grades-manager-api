import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import type { ClassCourseRow } from "../types";

export function getClassCoursesColumns(
	t: TFunction,
): ColumnDef<ClassCourseRow>[] {
	const notAvailable = t("common.labels.notAvailable", { defaultValue: "N/A" });
	return [
		{
			id: "code",
			header: t("admin.classCourses.table.code", { defaultValue: "Code" }),
			cell: ({ row }) => (
				<ClipboardCopy
					value={row.original.code}
					label={t("admin.classCourses.table.code", { defaultValue: "Code" })}
				/>
			),
		},
		{
			id: "class",
			header: t("admin.classCourses.table.class"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.className}</span>
			),
		},
		{
			id: "program",
			header: t("admin.classCourses.table.program"),
			cell: ({ row }) => row.original.programName ?? notAvailable,
		},
		{
			id: "course",
			header: t("admin.classCourses.table.course"),
			cell: ({ row: { original: cc } }) =>
				cc.courseName ? (
					<div className="space-y-0.5">
						<p className="font-medium text-sm">{cc.courseName}</p>
						{cc.courseCode && (
							<p className="text-muted-foreground text-xs">{cc.courseCode}</p>
						)}
					</div>
				) : (
					notAvailable
				),
		},
		{
			id: "semester",
			header: t("admin.classCourses.table.semester", {
				defaultValue: "Semester",
			}),
			cell: ({ row: { original: cc } }) =>
				cc.ueSemester
					? t(`admin.teachingUnits.semesters.${cc.ueSemester}`, {
							defaultValue: cc.ueSemester,
						})
					: notAvailable,
		},
		{
			id: "teacher",
			header: t("admin.classCourses.table.teacher"),
			cell: ({ row }) => row.original.teacherName,
		},
	];
}
