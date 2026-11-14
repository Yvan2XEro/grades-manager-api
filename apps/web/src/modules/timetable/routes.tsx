import { Navigate, Route } from "react-router";
import { RoleView } from "@/components/navigation/RoleView";
import AttendanceManagement from "@/modules/attendance/AttendanceManagement";
import AttendanceRates from "@/modules/attendance/AttendanceRates";
import ClassAttendanceOverview from "@/modules/attendance/ClassAttendanceOverview";
import RoomsPage from "./pages/rooms-page";
import StudentTimetablePage from "./pages/student-timetable-page";
import TeacherTimetablePage from "./pages/teacher-timetable-page";
import TimetableLayout from "./pages/timetable-layout";
import TimetablePage from "./pages/timetable-page";

/** Timetable hub for staff; teachers and students get their own schedule. */
export const timetableRoutes = (
	<Route
		path="timetable"
		element={
			<RoleView
				fallback={<TimetableLayout />}
				teacher={<TeacherTimetablePage />}
				student={<StudentTimetablePage />}
			/>
		}
	>
		<Route index element={<Navigate to="schedule" replace />} />
		<Route path="schedule" element={<TimetablePage />} />
		<Route path="rooms" element={<RoomsPage />} />
		<Route path="attendance" element={<AttendanceManagement />} />
		<Route path="rates" element={<AttendanceRates />} />
		<Route path="overview" element={<ClassAttendanceOverview />} />
	</Route>
);
