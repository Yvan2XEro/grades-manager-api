import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import LoadingScreen from "./components/ui/LoadingScreen";
import { authClient } from "./lib/auth-client";
import AcademicYearManagement from "./pages/admin/AcademicYearManagement";
import ClassCourseManagement from "./pages/admin/ClassCourseManagement";
import ClassManagement from "./pages/admin/ClassManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import AdminDashboard from "./pages/admin/Dashboard";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";
import ExamManagement from "./pages/admin/ExamManagement";
import GradeExport from "./pages/admin/GradeExport";
import MonitoringDashboard from "./pages/admin/MonitoringDashboard";
import NotificationsCenter from "./pages/admin/NotificationsCenter";
import StudentManagement from "./pages/admin/StudentManagement";
import TeachingUnitDetail from "./pages/admin/TeachingUnitDetail";
import TeachingUnitManagement from "./pages/admin/TeachingUnitManagement";
import UserManagement from "./pages/admin/UserManagement";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import WorkflowApprovals from "./pages/dean/WorkflowApprovals";
import PerformanceDashboard from "./pages/student/PerformanceDashboard";
import AttendanceAlerts from "./pages/teacher/AttendanceAlerts";
import CourseList from "./pages/teacher/CourseList";
import TeacherDashboard from "./pages/teacher/Dashboard";
import FacultyManagement from "./pages/teacher/FacultyManagement";
import GradeEntry from "./pages/teacher/GradeEntry";
import ProgramManagement from "./pages/teacher/ProgramManagement";
import WorkflowManager from "./pages/teacher/WorkflowManager";
import { useStore } from "./store";
import { trpc } from "./utils/trpc";

function App() {
	const { user, setUser, clearUser } = useStore();
	const _healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const { data: session, isPending } = authClient.useSession();

	const mapRole = useCallback((value?: string | null) => {
		switch ((value || "").toLowerCase()) {
			case "administrator":
			case "admin":
				return "administrator" as const;
			case "dean":
				return "dean" as const;
			case "teacher":
				return "teacher" as const;
			case "student":
				return "student" as const;
			case "super_admin":
			case "superadmin":
				return "super_admin" as const;
			default:
				return "guest" as const;
		}
	}, []);

	useEffect(() => {
		if (session?.user) {
			const [firstName, ...rest] = (session.user.name || "").split(" ");
			setUser({
				profileId: session.user.id,
				authUserId: session.user.id,
				email: session.user.email,
				role: mapRole(session.user.role),
				firstName,
				lastName: rest.join(" "),
				permissions: {
					canManageCatalog: ["administrator", "dean", "super_admin"].includes(
						mapRole(session.user.role),
					),
					canManageStudents: ["administrator", "dean", "super_admin"].includes(
						mapRole(session.user.role),
					),
					canGrade: [
						"teacher",
						"administrator",
						"dean",
						"super_admin",
					].includes(mapRole(session.user.role)),
					canAccessAnalytics: ["administrator", "dean", "super_admin"].includes(
						mapRole(session.user.role),
					),
				},
			});
		} else {
			clearUser();
		}
	}, [session, setUser, clearUser, mapRole]);

	if (isPending) {
		return <LoadingScreen />;
	}

	const role = user?.role ?? "guest";
	const isAdmin = role === "administrator" || role === "super_admin";
	const isDean = role === "dean";
	const isTeacher = role === "teacher";
	const isStudent = role === "student";

	return (
		<Routes>
			{/* Auth Routes */}
			<Route element={<AuthLayout />}>
				<Route path="/auth/login" element={<Login />} />
				<Route path="/auth/register" element={<Register />} />
				<Route path="/auth/forgot" element={<ForgotPassword />} />
				<Route path="/auth/reset" element={<ResetPassword />} />
			</Route>

			{/* Admin Routes */}
			{user && isAdmin && (
				<Route path="/admin" element={<DashboardLayout />}>
					<Route index element={<AdminDashboard />} />
					<Route path="courses" element={<CourseManagement />} />
					<Route path="academic-years" element={<AcademicYearManagement />} />
					<Route path="classes" element={<ClassManagement />} />
					<Route path="class-courses" element={<ClassCourseManagement />} />
					<Route path="students" element={<StudentManagement />} />
					<Route path="users" element={<UserManagement />} />
					<Route path="exams" element={<ExamManagement />} />
					<Route path="faculties" element={<FacultyManagement />} />
					<Route path="student-promotion" element={<StudentManagement />} />
					<Route path="programs" element={<ProgramManagement />} />
					<Route path="grade-export" element={<GradeExport />} />
					<Route path="monitoring" element={<MonitoringDashboard />} />
					<Route path="enrollments" element={<EnrollmentManagement />} />
					<Route path="teaching-units" element={<TeachingUnitManagement />} />
					<Route
						path="teaching-units/:teachingUnitId"
						element={<TeachingUnitDetail />}
					/>
					<Route path="notifications" element={<NotificationsCenter />} />
				</Route>
			)}

			{/* Dean Routes */}
			{user && isDean && (
				<Route path="/dean" element={<DashboardLayout />}>
					<Route index element={<MonitoringDashboard />} />
					<Route path="workflows" element={<WorkflowApprovals />} />
				</Route>
			)}

			{/* Teacher Routes */}
			{user && isTeacher && (
				<Route path="/teacher" element={<DashboardLayout />}>
					<Route index element={<TeacherDashboard />} />
					<Route path="courses" element={<CourseList />} />
					<Route path="grades/:courseId" element={<GradeEntry />} />
					<Route path="attendance" element={<AttendanceAlerts />} />
					<Route path="workflows" element={<WorkflowManager />} />
				</Route>
			)}

			{/* Student Routes */}
			{user && isStudent && (
				<Route path="/student" element={<DashboardLayout />}>
					<Route index element={<PerformanceDashboard />} />
				</Route>
			)}

			{/* Redirect based on authentication and role */}
			<Route
				path="*"
				element={
					user ? (
						isAdmin ? (
							<Navigate to="/admin" replace />
						) : isDean ? (
							<Navigate to="/dean" replace />
						) : isTeacher ? (
							<Navigate to="/teacher" replace />
						) : (
							<Navigate to="/student" replace />
						)
					) : (
						<Navigate to="/auth/login" replace />
					)
				}
			/>
		</Routes>
	);
}

export default App;
