import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { type GridSession, WeeklyGrid } from "@/components/ui/weekly-grid";
import { trpc } from "../../utils/trpc";

export default function TeacherTimetable() {
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);

	const { data, isPending } = useQuery(
		trpc.timetable.myTeacherTimetable.queryOptions({
			...(academicYearId ? { academicYearId } : {}),
		}),
	);

	const sessions = data ?? [];

	const gridSessions: GridSession[] = sessions.map((s) => ({
		id: s.id,
		dayOfWeek: s.dayOfWeek,
		startTime: s.startTime,
		endTime: s.endTime,
		room: s.room,
		label: s.classCourse?.courseRef?.name ?? s.classCourseId,
		subLabel: s.classCourse?.classRef?.name,
	}));

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="font-semibold text-xl">Mon emploi du temps</h1>
				<p className="text-muted-foreground text-sm">
					Vos sessions de cours hebdomadaires
				</p>
			</div>

			<div className="mb-6 w-64">
				<Label className="mb-1.5 block text-xs">Année académique</Label>
				<AcademicYearSelect
					value={academicYearId}
					onChange={setAcademicYearId}
				/>
			</div>

			{!isPending && sessions.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<Calendar className="h-8 w-8 text-muted-foreground/40" />
					</EmptyHeader>
					<EmptyTitle>Aucune session</EmptyTitle>
					<EmptyDescription>
						Vous n'avez pas encore de sessions programmées pour cette période.
					</EmptyDescription>
				</Empty>
			) : (
				<WeeklyGrid sessions={gridSessions} />
			)}
		</div>
	);
}
