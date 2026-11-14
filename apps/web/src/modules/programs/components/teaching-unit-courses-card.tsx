import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTeacherNames } from "../hooks/use-teachers";
import {
	useDeleteTeachingUnitCourse,
	useTeachingUnitCourses,
} from "../hooks/use-teaching-unit-courses";
import { getTeachingUnitCoursesColumns } from "../table/teaching-unit-courses-columns";
import type { UeCourse } from "../types";
import { UeCourseFormDialog } from "./ue-course-form-dialog";

interface TeachingUnitCoursesCardProps {
	teachingUnitId: string;
	programId: string;
	semesterCode?: string;
}

/** Courses (EC) of a teaching unit, with their create/edit/delete actions. */
export function TeachingUnitCoursesCard({
	teachingUnitId,
	programId,
	semesterCode,
}: TeachingUnitCoursesCardProps) {
	const { t } = useTranslation();
	const { data: courses = [], isLoading } =
		useTeachingUnitCourses(teachingUnitId);
	const teacherNames = useTeacherNames();
	const deleteCourse = useDeleteTeachingUnitCourse(teachingUnitId);
	const columns = useMemo(
		() => getTeachingUnitCoursesColumns(t, teacherNames),
		[t, teacherNames],
	);

	const openForm = (course?: UeCourse) =>
		UeCourseFormDialog.call({
			teachingUnitId,
			programId,
			semesterCode,
			existingCodes: courses.map((c) => c.code).filter(Boolean),
			course,
		});

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.teachingUnits.courses.deleteTitle", {
				defaultValue: "Delete element",
			}),
			message: t("admin.teachingUnits.courses.deleteMessage", {
				defaultValue: "This action cannot be undone.",
			}),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteCourse.mutateAsync(id).catch(() => undefined),
		});

	const rowActions = (course: UeCourse): RowAction[] => [
		{
			label: t("common.actions.edit", { defaultValue: "Edit" }),
			icon: Pencil,
			onSelect: () => openForm(course),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(course.id),
		},
	];

	if (!programId) return null;

	return (
		<Card className="border-0 shadow-sm">
			<CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<CardTitle>
						{t("admin.teachingUnits.courses.title", {
							defaultValue: "Constitutive elements",
						})}
					</CardTitle>
					<CardDescription>
						{t("admin.teachingUnits.courses.subtitle", {
							defaultValue: "Manage ECs tied to this teaching unit.",
						})}
					</CardDescription>
				</div>
				<Button onClick={() => openForm()}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.teachingUnits.courses.actions.add", {
						defaultValue: "Add element",
					})}
				</Button>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={courses}
					isLoading={isLoading}
					onRowClick={openForm}
					rowActions={rowActions}
					empty={
						<p className="text-muted-foreground text-sm">
							{t("admin.teachingUnits.courses.empty", {
								defaultValue: "No elements yet.",
							})}
						</p>
					}
				/>
			</CardContent>
		</Card>
	);
}
