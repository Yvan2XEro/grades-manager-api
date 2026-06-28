import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { useState } from "react";
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
import { type GridSession, WeeklyGrid } from "@/components/ui/weekly-grid";
import { trpc } from "../../utils/trpc";

export default function StudentTimetable() {
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);

	const { data, isPending } = useQuery(
		trpc.timetable.myStudentTimetable.queryOptions({
			...(academicYearId ? { academicYearId } : {}),
			...(semesterId ? { semesterId } : {}),
		}),
	);

	const sessions = data ?? [];

	const gridSessions: GridSession[] = sessions.map((s) => {
		const teacher = s.classCourse?.teacherRef;
		const teacherName = teacher
			? `${teacher.firstName} ${teacher.lastName}`
			: undefined;
		return {
			id: s.id,
			dayOfWeek: s.dayOfWeek,
			startTime: s.startTime,
			endTime: s.endTime,
			room: s.room,
			label: s.classCourse?.courseRef?.name ?? s.classCourseId,
			subLabel: teacherName ?? s.classCourse?.classRef?.name,
		};
	});

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="font-semibold text-xl">
					{t("teacher.timetable.myTitle")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("teacher.timetable.studentSubtitle")}
				</p>
			</div>

			<div className="mb-6 flex flex-wrap gap-4">
				<div className="w-64">
					<Label className="mb-1.5 block text-xs">
						{t("teacher.timetable.filterByYear")}
					</Label>
					<AcademicYearSelect
						value={academicYearId}
						onChange={(v) => {
							setAcademicYearId(v);
							setSemesterId(null);
						}}
					/>
				</div>
				{academicYearId && (
					<div className="w-52">
						<Label className="mb-1.5 block text-xs">
							{t("teacher.timetable.filterBySemester")}
						</Label>
						<SemesterSelect
							academicYearId={academicYearId}
							value={semesterId}
							onChange={setSemesterId}
						/>
					</div>
				)}
			</div>

			{!isPending && sessions.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<Calendar className="h-8 w-8 text-muted-foreground/40" />
					</EmptyHeader>
					<EmptyTitle>{t("teacher.timetable.noSessions")}</EmptyTitle>
					<EmptyDescription>
						{t("teacher.timetable.studentNoSessionsDesc")}
					</EmptyDescription>
				</Empty>
			) : (
				<WeeklyGrid sessions={gridSessions} />
			)}
		</div>
	);
}
