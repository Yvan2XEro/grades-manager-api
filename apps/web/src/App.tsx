import { useEffect, useMemo } from "react";
import { Route, Routes } from "react-router";
import type {
	BusinessRole,
	DomainUser,
} from "../../server/src/db/schema/app-schema";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { Redirector } from "./components/navigation/Redirector";
import LoadingScreen from "./components/ui/LoadingScreen";
import { authClient } from "./lib/auth-client";
import AcademicYearManagement from "./pages/admin/AcademicYearManagement";
import ClassCourseManagement from "./pages/admin/ClassCourseManagement";
import ClassManagement from "./pages/admin/ClassManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import AdminDashboard from "./pages/admin/Dashboard";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";
import ExamManagement from "./pages/admin/ExamManagement";
import ExamScheduler from "./pages/admin/ExamScheduler";
import ExamTypes from "./pages/admin/ExamTypes";
import GradeExport from "./pages/admin/GradeExport";
import MonitoringDashboard from "./pages/admin/MonitoringDashboard";
import NotificationsCenter from "./pages/admin/NotificationsCenter";
import RegistrationNumberFormatDetail from "./pages/admin/RegistrationNumberFormatDetail";
import RegistrationNumberFormats from "./pages/admin/RegistrationNumberFormats";
import RuleManagement from "./pages/admin/RuleManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import StudyCycleManagement from "./pages/admin/StudyCycleManagement";
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

function App() {
	const { setUser, clearUser } = useStore();
	const { data: session, isPending } = authClient.useSession();

	const memoUser = useMemo(() => {
		if (!session || !session.user) return null;
		const [firstName, ...rest] = (session.user.name || "").split(" ");
		const domainRole: BusinessRole = (session.domainProfiles?.[0] as DomainUser)
			.businessRole;
		return {
			profileId: session.user.id,
			authUserId: session.user.id,
			email: session.user.email,
			role: domainRole,
			firstName,
			lastName: rest.join(" "),
			domainProfiles: session.domainProfiles,
			permissions: {
				canManageCatalog: ["administrator", "dean", "super_admin"].includes(
					domainRole,
				),
				canManageStudents: ["administrator", "dean", "super_admin"].includes(
					domainRole,
				),
				canGrade: ["teacher", "administrator", "dean", "super_admin"].includes(
					domainRole,
				),
				canAccessAnalytics: ["administrator", "dean", "super_admin"].includes(
					domainRole,
				),
			},
		};
	}, [session]);

	useEffect(() => {
		if (memoUser) {
			setUser(memoUser);
		} else {
			clearUser();
		}
	}, [memoUser, setUser, clearUser]);

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

			{!!memoUser && (
				<>
					{/* Admin Routes */}
					<Route path="/admin" element={<DashboardLayout />}>
						<Route index element={<AdminDashboard />} />
						<Route path="courses" element={<CourseManagement />} />
						<Route path="academic-years" element={<AcademicYearManagement />} />
						<Route path="classes" element={<ClassManagement />} />
						<Route path="class-courses" element={<ClassCourseManagement />} />
						<Route path="students" element={<StudentManagement />} />
						<Route path="users" element={<UserManagement />} />
						<Route path="exams" element={<ExamManagement />} />
						<Route path="exam-types" element={<ExamTypes />} />
						<Route path="exam-scheduler" element={<ExamScheduler />} />
						<Route path="faculties" element={<FacultyManagement />} />
						<Route path="student-promotion" element={<StudentManagement />} />
						<Route path="rules" element={<RuleManagement />} />
						<Route
							path="registration-numbers"
							element={<RegistrationNumberFormats />}
						/>
						<Route
							path="registration-numbers/:formatId"
							element={<RegistrationNumberFormatDetail />}
						/>
						<Route path="programs" element={<ProgramManagement />} />
						<Route path="study-cycles" element={<StudyCycleManagement />} />
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

					{/* Dean Routes */}
					<Route path="/dean" element={<DashboardLayout />}>
						<Route index element={<MonitoringDashboard />} />
						<Route path="workflows" element={<WorkflowApprovals />} />
					</Route>

					{/* Teacher Routes */}
					<Route path="/teacher" element={<DashboardLayout />}>
						<Route index element={<TeacherDashboard />} />
						<Route path="courses" element={<CourseList />} />
						<Route path="grades/:courseId" element={<GradeEntry />} />
						<Route path="attendance" element={<AttendanceAlerts />} />
						<Route path="workflows" element={<WorkflowManager />} />
					</Route>

					{/* Student Routes */}
					<Route path="/student" element={<DashboardLayout />}>
						<Route index element={<PerformanceDashboard />} />
					</Route>
				</>
			)}

			<Route
				path="*"
				element={<Redirector isPending={isPending} user={memoUser} />}
			/>
		</Routes>
	);
}

export default App;
