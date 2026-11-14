import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";
import { MyTimetableView } from "../components/my-timetable-view";
import { useTimetablePeriod } from "../hooks/use-timetable-period";
import { toGridSession } from "../services/grid-sessions";

export default function StudentTimetablePage() {
	const { t } = useTranslation();
	const period = useTimetablePeriod();
	const { data, isPending } = useQuery(
		trpc.timetable.myStudentTimetable.queryOptions(period.input),
	);

	// Students see the teacher under the course name, or the class when unknown
	const sessions = (data ?? []).map((s) => {
		const teacher = s.classCourse?.teacherRef;
		const teacherName = teacher
			? `${teacher.firstName} ${teacher.lastName}`
			: undefined;
		return toGridSession(s, teacherName ?? s.classCourse?.classRef?.name);
	});

	return (
		<MyTimetableView
			subtitle={t("teacher.timetable.studentSubtitle")}
			emptyDescription={t("teacher.timetable.studentNoSessionsDesc")}
			period={period}
			sessions={sessions}
			isPending={isPending}
		/>
	);
}
