import { Navigate, Route, Routes } from "react-router";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { authClient, useSession } from "@/lib/auth-client";
import { AttendanceOverview } from "@/pages/attendance/attendance-overview";
import { ForgotPasswordPage } from "@/pages/auth/forgot-password";
import { LoginPage } from "@/pages/auth/login";
import { ResetPasswordPage } from "@/pages/auth/reset-password";
import { CouncilDetail } from "@/pages/class-councils/council-detail";
import { ClassCouncilsList } from "@/pages/class-councils/councils-list";
import { ClassAssignments } from "@/pages/classes/class-assignments";
import { ClassDetail } from "@/pages/classes/class-detail";
import { ClassGrades } from "@/pages/classes/class-grades";
import { ClassRoster } from "@/pages/classes/class-roster";
import { ClassesList } from "@/pages/classes/classes-list";
import { AdminDashboard } from "@/pages/dashboards/admin-dashboard";
import { PrincipalDashboard } from "@/pages/dashboards/principal-dashboard";
import { TeacherDashboard } from "@/pages/dashboards/teacher-dashboard";
import { Enrollments } from "@/pages/enrollments";
import { FinanceOverview } from "@/pages/finance/finance-overview";
import { CommentsGrid } from "@/pages/grades/comments-grid";
import { GradeEntry } from "@/pages/grades/grade-entry";
import { GradeGrid } from "@/pages/grades/grade-grid";
import { ExamSessionDetail } from "@/pages/official-exams/exam-session-detail";
import { ExamSessionNew } from "@/pages/official-exams/exam-session-new";
import { OfficialExamsList } from "@/pages/official-exams/official-exams-list";
import { ExamCandidatesTab } from "@/pages/official-exams/tabs/candidates-tab";
import { ExamResultsTab } from "@/pages/official-exams/tabs/results-tab";
import { ExamSettingsTab } from "@/pages/official-exams/tabs/settings-tab";
import { OnboardingPage } from "@/pages/onboarding/onboarding";
import { ClassReportCards } from "@/pages/report-cards/class-report-cards";
import { ReportCardPreview } from "@/pages/report-cards/report-card-preview";
import { ReportCardsList } from "@/pages/report-cards/report-cards-list";
import { Settings } from "@/pages/settings";
import { Staff } from "@/pages/staff";
import { StaffAssignmentsTab } from "@/pages/staff/staff-assignments-tab";
import { StaffDetail, StaffProfileTab } from "@/pages/staff/staff-detail";
import { StudentDetail } from "@/pages/students/student-detail";
import { StudentNew } from "@/pages/students/student-new";
import { StudentsList } from "@/pages/students/students-list";
import { StudentAttendanceTab } from "@/pages/students/tabs/attendance-tab";
import { StudentFeesTab } from "@/pages/students/tabs/fees-tab";
import { StudentGradesTab } from "@/pages/students/tabs/grades-tab";
import { StudentProfileTab } from "@/pages/students/tabs/profile-tab";
import { SubjectAssignments } from "@/pages/subject-assignments/subject-assignments";
import { Subjects } from "@/pages/subjects";
import { TrackDetail } from "@/pages/tracks/track-detail";
import { TracksList } from "@/pages/tracks/tracks-list";

function Dashboard() {
	const { data: session } = useSession();
	const { data: org } = authClient.useActiveOrganization();
	const myMember = org?.members?.find((m) => m.userId === session?.user?.id);
	const role = myMember?.role ?? "teacher";
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
				path="/onboarding"
				element={
					<ProtectedRoute>
						<OnboardingPage />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/*"
				element={
					<ProtectedRoute>
						<AppShell>
							<Routes>
								<Route index element={<Dashboard />} />

								{/* Students */}
								<Route path="students" element={<StudentsList />} />
								<Route path="students/new" element={<StudentNew />} />
								<Route path="students/:id/*" element={<StudentDetail />}>
									<Route index element={<Navigate to="profile" replace />} />
									<Route path="profile" element={<StudentProfileTab />} />
									<Route path="grades" element={<StudentGradesTab />} />
									<Route path="fees" element={<StudentFeesTab />} />
									<Route path="attendance" element={<StudentAttendanceTab />} />
								</Route>

								{/* Enrollments */}
								<Route path="enrollments" element={<Enrollments />} />

								{/* Classes */}
								<Route path="classes" element={<ClassesList />} />
								<Route path="classes/:id/*" element={<ClassDetail />}>
									<Route index element={<Navigate to="roster" replace />} />
									<Route path="roster" element={<ClassRoster />} />
									<Route path="grades" element={<ClassGrades />} />
									<Route path="assignments" element={<ClassAssignments />} />
								</Route>

								{/* Subjects */}
								<Route path="subjects" element={<Subjects />} />

								{/* Staff */}
								<Route path="staff" element={<Staff />} />
								<Route path="staff/:id/*" element={<StaffDetail />}>
									<Route index element={<Navigate to="profile" replace />} />
									<Route path="profile" element={<StaffProfileTab />} />
									<Route path="assignments" element={<StaffAssignmentsTab />} />
								</Route>

								{/* Report cards */}
								<Route path="report-cards" element={<ReportCardsList />} />
								<Route
									path="report-cards/:classId/:termId"
									element={<ClassReportCards />}
								/>
								<Route
									path="report-cards/:id"
									element={<ReportCardPreview />}
								/>

								{/* Class councils */}
								<Route path="class-councils" element={<ClassCouncilsList />} />
								<Route path="class-councils/:id" element={<CouncilDetail />} />

								{/* Official exams */}
								<Route path="official-exams" element={<OfficialExamsList />} />
								<Route path="official-exams/new" element={<ExamSessionNew />} />
								<Route
									path="official-exams/:id/*"
									element={<ExamSessionDetail />}
								>
									<Route index element={<Navigate to="candidates" replace />} />
									<Route path="candidates" element={<ExamCandidatesTab />} />
									<Route path="results" element={<ExamResultsTab />} />
									<Route path="settings" element={<ExamSettingsTab />} />
								</Route>

								{/* Finance */}
								<Route path="finance" element={<FinanceOverview />} />

								{/* Attendance */}
								<Route path="attendance" element={<AttendanceOverview />} />

								{/* Grades */}
								<Route path="grades" element={<GradeEntry />} />
								<Route
									path="grades/:classId/:subjectId/:termId"
									element={<GradeGrid />}
								/>
								<Route
									path="grades/:classId/:subjectId/:termId/comments"
									element={<CommentsGrid />}
								/>

								{/* Other */}
								<Route path="tracks" element={<TracksList />} />
								<Route path="tracks/:id" element={<TrackDetail />} />
								<Route
									path="terms"
									element={<Navigate to="/settings" replace />}
								/>
								<Route
									path="subject-assignments"
									element={<SubjectAssignments />}
								/>
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
