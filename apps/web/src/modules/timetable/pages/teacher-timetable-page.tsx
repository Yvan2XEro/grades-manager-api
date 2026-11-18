import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";
import { MyTimetableView } from "../components/my-timetable-view";
import { useTimetablePeriod } from "../hooks/use-timetable-period";
import { toGridSession } from "../services/grid-sessions";

export default function TeacherTimetablePage() {
	const { t } = useTranslation();
	const period = useTimetablePeriod();
	const { data, isPending } = useQuery(
		trpc.timetable.myTeacherTimetable.queryOptions(period.input),
	);

	return (
		<MyTimetableView
			subtitle={t("teacher.timetable.mySubtitle")}
			emptyDescription={t("teacher.timetable.noSessionsDesc")}
			period={period}
			sessions={(data ?? []).map((s) => toGridSession(s))}
			isPending={isPending}
		/>
	);
}
