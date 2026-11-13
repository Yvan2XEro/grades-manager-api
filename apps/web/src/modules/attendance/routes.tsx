import { Route } from "react-router";
import AttendanceAlerts from "./AttendanceAlerts";
import AttendanceManagement from "./AttendanceManagement";
import TeacherAttendanceRates from "./TeacherAttendanceRates";

/** Teacher attendance pages (the admin views live in the timetable hub). */
export const attendanceRoutes = (
	<>
		<Route path="attendance" element={<AttendanceManagement />} />
		<Route path="attendance/alerts" element={<AttendanceAlerts />} />
		<Route path="attendance/rates" element={<TeacherAttendanceRates />} />
	</>
);
