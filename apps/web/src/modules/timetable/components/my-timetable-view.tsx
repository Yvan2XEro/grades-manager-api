import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { type GridSession, WeeklyGrid } from "@/components/ui/weekly-grid";
import type { TimetablePeriod } from "../hooks/use-timetable-period";

interface Props {
	subtitle: string;
	emptyDescription: string;
	period: TimetablePeriod;
	sessions: GridSession[];
	isPending: boolean;
}

/** Own weekly timetable of a teacher or a student, filtered by period. */
export function MyTimetableView({
	subtitle,
	emptyDescription,
	period,
	sessions,
	isPending,
}: Props) {
	const { t } = useTranslation();
	return (
		<div className="md:p-6">
			<div className="mb-6">
				<h1 className="font-semibold text-xl">
					{t("teacher.timetable.myTitle")}
				</h1>
				<p className="text-muted-foreground text-sm">{subtitle}</p>
			</div>

			<div className="mb-6 flex flex-wrap gap-4">
				<div className="w-full sm:w-64">
					<Label className="mb-1.5 block text-xs">
						{t("teacher.timetable.filterByYear")}
					</Label>
					<AcademicYearSelect
						value={period.academicYearId}
						onChange={period.changeAcademicYear}
					/>
				</div>
				{period.academicYearId && (
					<div className="w-full sm:w-52">
						<Label className="mb-1.5 block text-xs">
							{t("teacher.timetable.filterBySemester")}
						</Label>
						<SemesterSelect
							value={period.semesterId}
							onChange={period.changeSemester}
						/>
					</div>
				)}
			</div>

			{isPending ? (
				<Skeleton className="h-72 w-full" />
			) : sessions.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<Calendar className="h-8 w-8 text-muted-foreground/40" />
					</EmptyHeader>
					<EmptyTitle>{t("teacher.timetable.myNoSessionsTitle")}</EmptyTitle>
					<EmptyDescription>{emptyDescription}</EmptyDescription>
				</Empty>
			) : (
				<WeeklyGrid sessions={sessions} />
			)}
		</div>
	);
}
