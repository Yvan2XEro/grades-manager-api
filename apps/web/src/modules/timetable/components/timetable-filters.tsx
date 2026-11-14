import { XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { TimetableFilters as Filters } from "../hooks/use-timetable-filters";
import type { TimetableClassCourse } from "../types";

const ALL_TEACHERS = "__all_teachers__";
const ALL_COURSES = "__all_courses__";

interface Props {
	filters: Filters;
	teachers: { id: string; firstName: string | null; lastName: string | null }[];
	classCourses: TimetableClassCourse[];
}

/** Year, semester, class, teacher and course filters of the timetable. */
export function TimetableFilters({ filters, teachers, classCourses }: Props) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-wrap items-end gap-3">
			<AcademicYearSelect
				value={filters.academicYearId}
				onChange={filters.changeAcademicYear}
				autoSelectActive={false}
				allowAll
				allLabel={t("teacher.timetable.allYears") ?? "Toutes les années"}
				className="w-48"
			/>
			{filters.academicYearId && (
				<div className="w-44">
					<SemesterSelect
						academicYearId={filters.academicYearId}
						value={filters.semesterId}
						onChange={filters.changeSemester}
					/>
				</div>
			)}
			<div className="w-48">
				<ClassSelect
					academicYearId={filters.academicYearId}
					value={filters.classId}
					onChange={filters.changeClass}
				/>
			</div>
			<Select
				value={filters.teacherId ?? ALL_TEACHERS}
				onValueChange={(v) =>
					filters.changeTeacher(v === ALL_TEACHERS ? null : v)
				}
			>
				<SelectTrigger className="w-48">
					<SelectValue placeholder={t("teacher.timetable.allTeachers")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_TEACHERS}>
						{t("teacher.timetable.allTeachers")}
					</SelectItem>
					{teachers.map((u) => (
						<SelectItem key={u.id} value={u.id}>
							{u.firstName} {u.lastName}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select
				value={filters.classCourseId ?? ALL_COURSES}
				onValueChange={(v) =>
					filters.changeClassCourse(v === ALL_COURSES ? null : v)
				}
			>
				<SelectTrigger className="w-60">
					<SelectValue placeholder={t("teacher.timetable.allCourses")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_COURSES}>
						{t("teacher.timetable.allCourses")}
					</SelectItem>
					{classCourses.map((cc) => (
						<SelectItem key={cc.id} value={cc.id}>
							{cc.courseRef?.name ?? cc.code}
							{cc.classRef && (
								<span className="ml-1 text-muted-foreground text-xs">
									— {cc.classRef.name}
								</span>
							)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{filters.hasFilters && (
				<Button
					variant="ghost"
					size="sm"
					className="gap-1.5 text-muted-foreground"
					onClick={filters.clear}
				>
					<XCircle className="size-4" />
					{t("common.clearFilters")}
				</Button>
			)}
		</div>
	);
}
