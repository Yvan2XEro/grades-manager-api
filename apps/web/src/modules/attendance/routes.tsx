import { Route } from "react-router";
import AttendanceAlertsPage from "./pages/attendance-alerts-page";
import AttendancePage from "./pages/attendance-page";
import TeacherAttendanceRatesPage from "./pages/teacher-attendance-rates-page";

/** Teacher attendance pages (the admin views live in the timetable hub). */
export const attendanceRoutes = (
	<>
		<Route path="attendance" element={<AttendancePage />} />
		<Route path="attendance/alerts" element={<AttendanceAlertsPage />} />
		<Route path="attendance/rates" element={<TeacherAttendanceRatesPage />} />
	</>
);
