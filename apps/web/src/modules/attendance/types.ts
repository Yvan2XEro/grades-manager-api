import type { RouterOutputs } from "@/utils/trpc";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type AttendanceSession =
	RouterOutputs["attendance"]["listSessions"][number];
export type AttendanceSessionDetail = RouterOutputs["attendance"]["getSession"];
export type AttendanceRosterItem =
	RouterOutputs["attendance"]["getRoster"][number];
export type TimetableSlot = RouterOutputs["timetable"]["list"][number];

/** Class course as listed in the attendance pickers. */
export type AttendanceClassCourse = {
	id: string;
	code: string;
	courseRef: { name: string } | null;
	classRef: { name: string } | null;
};

/** Per-student attendance rate row (admin rates page). */
export type StudentRateRow =
	RouterOutputs["attendance"]["getAttendanceRates"]["students"][number] & {
		id: string;
		name: string;
		registrationNumber: string | undefined;
	};
export type TeacherCourseRateRow =
	RouterOutputs["attendance"]["myCoursesRates"][number] & { id: string };
export type ClassCourseOverviewRow =
	RouterOutputs["attendance"]["getClassAttendanceOverview"][number] & {
		id: string;
	};
