import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { Label } from "@/components/ui/label";

interface PeriodFiltersProps {
	academicYearId: string | null;
	semesterId: string | null;
	onAcademicYearChange: (id: string | null) => void;
	onSemesterChange: (id: string | null) => void;
}

/** Academic year + semester filters shown above period-scoped tables. */
export function PeriodFilters(props: PeriodFiltersProps) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-wrap items-end gap-4">
			<div className="w-56 space-y-1">
				<Label className="text-muted-foreground text-xs">
					{t("admin.classes.filters.academicYear", {
						defaultValue: "Academic Year",
					})}
				</Label>
				<AcademicYearSelect
					value={props.academicYearId}
					onChange={props.onAcademicYearChange}
				/>
			</div>
			<div className="w-56 space-y-1">
				<Label className="text-muted-foreground text-xs">
					{t("admin.classes.filters.semester", { defaultValue: "Semester" })}
				</Label>
				<SemesterSelect
					value={props.semesterId}
					onChange={props.onSemesterChange}
				/>
			</div>
		</div>
	);
}
