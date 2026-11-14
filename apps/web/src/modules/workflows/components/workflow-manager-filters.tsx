import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

/** Year / semester filters and the class course picker of the teacher. */
export function WorkflowManagerFilters({
	filterYear,
	filterSemester,
	selectedClassCourse,
	classCourses,
	onYearChange,
	onSemesterChange,
	onClassCourseChange,
}: {
	filterYear: string | null;
	filterSemester: string | null;
	selectedClassCourse: string;
	classCourses: { id: string; class: string; course: string }[];
	onYearChange: (v: string | null) => void;
	onSemesterChange: (v: string | null) => void;
	onClassCourseChange: (v: string) => void;
}) {
	const { t } = useTranslation();
	return (
		<>
			<div className="flex flex-wrap items-end gap-4">
				<div className="w-56">
					<Label className="mb-1 block font-medium text-sm">
						{t("admin.classes.filters.academicYear", {
							defaultValue: "Academic Year",
						})}
					</Label>
					<AcademicYearSelect value={filterYear} onChange={onYearChange} />
				</div>
				<div className="w-56">
					<Label className="mb-1 block font-medium text-sm">
						{t("admin.classes.filters.semester", { defaultValue: "Semester" })}
					</Label>
					<SemesterSelect value={filterSemester} onChange={onSemesterChange} />
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="class-course">
					{t("teacher.workflow.selectCourse", {
						defaultValue: "Select class course",
					})}
				</Label>
				<Select
					value={selectedClassCourse || undefined}
					onValueChange={onClassCourseChange}
				>
					<SelectTrigger id="class-course">
						<SelectValue
							placeholder={t("teacher.workflow.selectCourse", {
								defaultValue: "Select class course",
							})}
						/>
					</SelectTrigger>
					<SelectContent>
						{classCourses.map((cc) => (
							<SelectItem key={cc.id} value={cc.id}>
								{cc.class} • {cc.course}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</>
	);
}
