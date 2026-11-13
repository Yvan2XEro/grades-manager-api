import { Navigate, Route } from "react-router";
import { RoleView } from "@/components/navigation/RoleView";
import AttendanceManagement from "@/modules/attendance/AttendanceManagement";
import AttendanceRates from "@/modules/attendance/AttendanceRates";
import ClassAttendanceOverview from "@/modules/attendance/ClassAttendanceOverview";
import RoomsManagement from "./RoomsManagement";
import StudentTimetable from "./StudentTimetable";
import TeacherTimetable from "./TeacherTimetable";
import TimetableHub from "./TimetableHub";
import TimetableManagement from "./TimetableManagement";

/** Timetable hub for staff; teachers and students get their own schedule. */
export const timetableRoutes = (
	<Route
		path="timetable"
		element={
			<RoleView
				fallback={<TimetableHub />}
				teacher={<TeacherTimetable />}
				student={<StudentTimetable />}
			/>
		}
	>
		<Route index element={<Navigate to="schedule" replace />} />
		<Route path="schedule" element={<TimetableManagement />} />
		<Route path="rooms" element={<RoomsManagement />} />
		<Route path="attendance" element={<AttendanceManagement />} />
		<Route path="rates" element={<AttendanceRates />} />
		<Route path="overview" element={<ClassAttendanceOverview />} />
	</Route>
);
