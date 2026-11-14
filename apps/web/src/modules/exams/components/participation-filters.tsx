import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { useParticipationFilters } from "../hooks/use-exam-participation";

/** Academic year, class course and exam pickers of the participation roster. */
export function ParticipationFilters({
	filters,
}: {
	filters: ReturnType<typeof useParticipationFilters>;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-wrap gap-4">
			<div className="w-52 space-y-1">
				<Label className="text-xs">
					{t("admin.examParticipation.academicYear")}
				</Label>
				<AcademicYearSelect
					value={filters.academicYearId}
					onChange={filters.setAcademicYearId}
				/>
			</div>
			<div className="w-52 space-y-1">
				<Label className="text-xs">
					{t("admin.examParticipation.classCourse")}
				</Label>
				<Select
					value={filters.classCourseId ?? ""}
					onValueChange={(v) => filters.setClassCourseId(v || null)}
				>
					<SelectTrigger className="text-xs">
						<SelectValue
							placeholder={t("admin.examParticipation.classCourseLabel")}
						/>
					</SelectTrigger>
					<SelectContent>
						{filters.classCourses.map((cc) => (
							<SelectItem key={cc.id} value={cc.id}>
								{cc.code}
								{cc.courseName ? ` — ${cc.courseName}` : ""}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="w-52 space-y-1">
				<Label className="text-xs">{t("admin.examParticipation.exam")}</Label>
				<Select
					value={filters.examId ?? ""}
					onValueChange={(v) => filters.setExamId(v || null)}
					disabled={!filters.classCourseId}
				>
					<SelectTrigger className="text-xs">
						<SelectValue
							placeholder={t("admin.examParticipation.examPlaceholder")}
						/>
					</SelectTrigger>
					<SelectContent>
						{filters.exams.map((e) => (
							<SelectItem key={e.id} value={e.id}>
								{e.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
