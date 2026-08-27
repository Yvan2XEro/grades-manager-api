import { Navigate, Route, Routes } from "react-router";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { useSession } from "@/lib/auth-client";
import { AttendanceOverview } from "@/pages/attendance/attendance-overview";
import { ForgotPasswordPage } from "@/pages/auth/forgot-password";
import { LoginPage } from "@/pages/auth/login";
import { ResetPasswordPage } from "@/pages/auth/reset-password";
import { ClassCouncilsList } from "@/pages/class-councils/councils-list";
import { ClassDetail } from "@/pages/classes/class-detail";
import { ClassesList } from "@/pages/classes/classes-list";
import { AdminDashboard } from "@/pages/dashboards/admin-dashboard";
import { PrincipalDashboard } from "@/pages/dashboards/principal-dashboard";
import { TeacherDashboard } from "@/pages/dashboards/teacher-dashboard";
import { Enrollments } from "@/pages/enrollments";
import { FinanceOverview } from "@/pages/finance/finance-overview";
import { GradeEntry } from "@/pages/grades/grade-entry";
import { OfficialExamsList } from "@/pages/official-exams/official-exams-list";
import { ReportCardsList } from "@/pages/report-cards/report-cards-list";
import { Settings } from "@/pages/settings";
import { Staff } from "@/pages/staff";
import { StudentDetail } from "@/pages/students/student-detail";
import { StudentsList } from "@/pages/students/students-list";
import { Subjects } from "@/pages/subjects";
import { TracksList } from "@/pages/tracks/tracks-list";

function Dashboard() {
	const { data: session } = useSession();
	const role = (session as any)?.session?.member?.role ?? "teacher";
	if (role === "admin") return <AdminDashboard />;
	if (role === "principal") return <PrincipalDashboard />;
	return <TeacherDashboard />;
}

export function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password" element={<ResetPasswordPage />} />

			<Route
				path="/*"
				element={
					<ProtectedRoute>
						<AppShell>
							<Routes>
								<Route index element={<Dashboard />} />
								<Route path="students" element={<StudentsList />} />
								<Route path="students/:id" element={<StudentDetail />} />
								<Route path="enrollments" element={<Enrollments />} />
								<Route path="classes" element={<ClassesList />} />
								<Route path="classes/:id" element={<ClassDetail />} />
								<Route path="subjects" element={<Subjects />} />
								<Route path="staff" element={<Staff />} />
								<Route path="report-cards" element={<ReportCardsList />} />
								<Route path="class-councils" element={<ClassCouncilsList />} />
								<Route path="official-exams" element={<OfficialExamsList />} />
								<Route path="finance" element={<FinanceOverview />} />
								<Route path="attendance" element={<AttendanceOverview />} />
								<Route path="grades" element={<GradeEntry />} />
								<Route path="tracks" element={<TracksList />} />
								<Route path="settings" element={<Settings />} />
							</Routes>
						</AppShell>
					</ProtectedRoute>
				}
			/>

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
