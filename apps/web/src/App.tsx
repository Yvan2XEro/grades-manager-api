import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import LoadingScreen from "./components/ui/LoadingScreen";
import { authClient } from "./lib/auth-client";
import AcademicYearManagement from "./pages/admin/AcademicYearManagement";
import ClassCourseManagement from "./pages/admin/ClassCourseManagement";
import ClassManagement from "./pages/admin/ClassManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import AdminDashboard from "./pages/admin/Dashboard";
import ExamManagement from "./pages/admin/ExamManagement";
import GradeExport from "./pages/admin/GradeExport";
import StudentManagement from "./pages/admin/StudentManagement";
import UserManagement from "./pages/admin/UserManagement";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import CourseList from "./pages/teacher/CourseList";
import TeacherDashboard from "./pages/teacher/Dashboard";
import FacultyManagement from "./pages/teacher/FacultyManagement";
import GradeEntry from "./pages/teacher/GradeEntry";
import ProgramManagement from "./pages/teacher/ProgramManagement";
import StudentPromotion from "./pages/teacher/StudentPromotion";
import { useStore } from "./store";
import { trpc } from "./utils/trpc";

function App() {
	const { user, setUser, clearUser } = useStore();
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (session?.user) {
			const [firstName, ...rest] = (session.user.name || "").split(" ");
			setUser({
				id: session.user.id,
				email: session.user.email,
				role: (session.user.role || "").toLowerCase() as "admin" | "teacher",
				firstName,
				lastName: rest.join(" "),
			});
		} else {
			clearUser();
		}
	}, [session, setUser, clearUser]);

	if (isPending) {
		return <LoadingScreen />;
	}

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
			{user && user.role === "admin" && (
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
					<Route path="student-promotion" element={<StudentPromotion />} />
					<Route path="programs" element={<ProgramManagement />} />
					<Route path="grade-export" element={<GradeExport />} />
				</Route>
			)}

			{/* Teacher Routes */}
			{user && user.role !== "admin" && (
				<Route path="/teacher" element={<DashboardLayout />}>
					<Route index element={<TeacherDashboard />} />
					<Route path="courses" element={<CourseList />} />
					<Route path="grades/:courseId" element={<GradeEntry />} />
				</Route>
			)}

			{/* Redirect based on authentication and role */}
			<Route
				path="*"
				element={
					user ? (
						user.role === "admin" ? (
							<Navigate to="/admin" replace />
						) : (
							<Navigate to="/teacher" replace />
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
