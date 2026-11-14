import type { GridSession } from "@/components/ui/weekly-grid";

type SessionLike = {
	id: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	room: string | null;
	classCourseId: string;
	classCourse?: {
		courseRef?: { name: string } | null;
		classRef?: { name: string } | null;
	} | null;
};

/** Maps a session to a `WeeklyGrid` cell: course name, class name below. */
export const toGridSession = (
	s: SessionLike,
	subLabel: string | undefined = s.classCourse?.classRef?.name,
): GridSession => ({
	id: s.id,
	dayOfWeek: s.dayOfWeek,
	startTime: s.startTime,
	endTime: s.endTime,
	room: s.room,
	label: s.classCourse?.courseRef?.name ?? s.classCourseId,
	subLabel,
});
