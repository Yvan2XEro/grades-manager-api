import type { RouterOutputs } from "@/utils/trpc";

/** A timetable session as listed by `timetable.list`. */
export type Session = RouterOutputs["timetable"]["list"][number];

export type Room = RouterOutputs["rooms"]["list"][number];

/** A class course offered in the timetable filters, import template… */
export type TimetableClassCourse = {
	id: string;
	code: string;
	teacher: string | null;
	courseRef: { name: string } | null;
	classRef: { name: string } | null;
};
