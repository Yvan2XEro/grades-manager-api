import { useEffect, useMemo, useRef } from "react";
import { Route, Routes } from "react-router";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { Redirector } from "./components/navigation/Redirector";
import LoadingScreen from "./components/ui/LoadingScreen";
import { authClient } from "./lib/auth-client";
import { detectOrganizationSlug } from "./lib/organization";
import AccountSettings from "./pages/AccountSettings";
import AcademicYearManagement from "./pages/admin/AcademicYearManagement";
import ApiKeysManagement from "./pages/admin/ApiKeysManagement";
import BatchJobDetail from "./pages/admin/batch-jobs/BatchJobDetail";
import BatchJobsDashboard from "./pages/admin/batch-jobs/BatchJobsDashboard";
import CenterDetail from "./pages/admin/CenterDetail";
import CenterManagement from "./pages/admin/CenterManagement";
import ClassCourseManagement from "./pages/admin/ClassCourseManagement";
import ClassDocumentTemplates from "./pages/admin/ClassDocumentTemplates";
import ClassManagement from "./pages/admin/ClassManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import AdminDashboard from "./pages/admin/Dashboard";
import {
	DeliberationDetail,
	DeliberationRules,
	DeliberationsList,
} from "./pages/admin/deliberations";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";
import ExamManagement from "./pages/admin/ExamManagement";
import ExamScheduler from "./pages/admin/ExamScheduler";
import ExamTypes from "./pages/admin/ExamTypes";
import ExportTemplateEditor from "./pages/admin/ExportTemplateEditor";
import ExportTemplatesManagement from "./pages/admin/ExportTemplatesManagement";
import FacultyManagement from "./pages/admin/FacultyManagement";
import GradeAccessGrants from "./pages/admin/GradeAccessGrants";
import GradeExport from "./pages/admin/GradeExport";
import GraduatedStudents from "./pages/admin/GraduatedStudents";
import InstitutionSettings from "./pages/admin/InstitutionSettings";
import MonitoringDashboard from "./pages/admin/MonitoringDashboard";
import NotificationsCenter from "./pages/admin/NotificationsCenter";
import {
	EvaluatePromotionPage,
	ExecutePromotionPage,
	ExecutionHistoryPage,
	PromotionRulesDashboard,
	RulesListPage,
} from "./pages/admin/promotion-rules";
import RegistrationNumberFormatDetail from "./pages/admin/RegistrationNumberFormatDetail";
import RegistrationNumberFormats from "./pages/admin/RegistrationNumberFormats";
import RetakeEligibility from "./pages/admin/RetakeEligibility";
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
import GradeEntry from "./pages/teacher/GradeEntry";
import GradeSpreadsheet from "./pages/teacher/GradeSpreadsheet";
import ProgramManagement from "./pages/teacher/ProgramManagement";
import WorkflowManager from "./pages/teacher/WorkflowManager";
import type { BusinessRole } from "./store";
import { roleGuards, useStore } from "./store";

function App() {
	const {
		setUser,
		clearUser,
		setActiveOrganizationSlug,
		activeOrganizationSlug,
	} = useStore();
	const {
		data: session,
		isPending,
		refetch: refetchSession,
	} = authClient.useSession();
	const activatedSlugRef = useRef<string | null>(null);

	const memoUser = useMemo(() => {
		if (!session || !session.user) return null;
		const [firstName, ...rest] = (session.user.name || "").split(" ");
		const membershipRole = session.activeMembership?.role ?? null;
		const role = normalizeRole(membershipRole);
		return {
			profileId: session.user.id,
			authUserId: session.user.id,
			email: session.user.email,
			image: session.user.image ?? null,
			role,
			firstName,
			lastName: rest.join(" "),
			domainProfiles: session.domainProfiles,
			permissions: {
				canManageCatalog: roleGuards.manageCatalog.includes(role),
				canManageStudents: roleGuards.manageStudents.includes(role),
				canGrade: roleGuards.grade.includes(role),
				canAccessAnalytics: roleGuards.viewAnalytics.includes(role),
			},
		};
	}, [session]);

	// Detect and set organization slug on mount
	useEffect(() => {
		try {
			const slug = detectOrganizationSlug();
			if (slug && slug !== activeOrganizationSlug) {
				setActiveOrganizationSlug(slug);
			}
		} catch (error) {
			console.error("Failed to detect organization slug:", error);
		}
	}, [activeOrganizationSlug, setActiveOrganizationSlug]);

	// Set active organization in Better Auth when we have both session and slug
	useEffect(() => {
		if (!session?.user) {
			activatedSlugRef.current = null;
			return;
		}
		// Skip if org was already set AND membership is populated (role resolved)
		if (
			session.session?.activeOrganizationId &&
			session.activeMembership?.role
		) {
			activatedSlugRef.current = activeOrganizationSlug;
			return;
		}
		if (session?.user && activeOrganizationSlug) {
			if (activatedSlugRef.current === activeOrganizationSlug) {
				return;
			}
			let cancelled = false;
			const activateOrganization = async () => {
				const result = await authClient.organization.setActive({
					organizationSlug: activeOrganizationSlug,
				});
				if (result.error) {
					console.error("Failed to set active organization:", result.error);
					return; // Ne pas marquer comme fait — permettre un retry
				}
				if (!cancelled) {
					activatedSlugRef.current = activeOrganizationSlug;
					// Force session refetch so activeMembership and role update immediately
					await refetchSession();
				}
			};
			void activateOrganization();
			return () => {
				cancelled = true;
			};
		}
	}, [
		session?.user?.id,
		activeOrganizationSlug,
		refetchSession,
		session?.activeMembership?.role,
		session?.session?.activeOrganizationId,
		session?.user,
	]);

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
						<Route path="retake-eligibility" element={<RetakeEligibility />} />
						<Route path="exam-types" element={<ExamTypes />} />
						<Route path="exam-scheduler" element={<ExamScheduler />} />
						<Route
							path="export-templates"
							element={<ExportTemplatesManagement />}
						/>
						<Route
							path="export-templates/:templateId"
							element={<ExportTemplateEditor />}
						/>
						<Route
							path="class-document-templates"
							element={<ClassDocumentTemplates />}
						/>
						<Route path="student-promotion" element={<StudentManagement />} />
						<Route path="graduation" element={<GraduatedStudents />} />
						<Route path="rules" element={<RuleManagement />} />
						<Route
							path="registration-numbers"
							element={<RegistrationNumberFormats />}
						/>
						<Route
							path="registration-numbers/:formatId"
							element={<RegistrationNumberFormatDetail />}
						/>
						<Route path="institution" element={<InstitutionSettings />} />
						<Route path="faculties" element={<FacultyManagement />} />
						<Route path="programs" element={<ProgramManagement />} />
						<Route path="study-cycles" element={<StudyCycleManagement />} />
						<Route path="centers" element={<CenterManagement />} />
						<Route path="centers/new" element={<CenterDetail />} />
						<Route path="centers/:centerId" element={<CenterDetail />} />
						<Route path="grade-export" element={<GradeExport />} />
						<Route path="grade-access" element={<GradeAccessGrants />} />
						<Route path="monitoring" element={<MonitoringDashboard />} />
						<Route path="batch-jobs" element={<BatchJobsDashboard />} />
						<Route path="batch-jobs/:jobId" element={<BatchJobDetail />} />
						<Route path="enrollments" element={<EnrollmentManagement />} />
						<Route path="teaching-units" element={<TeachingUnitManagement />} />
						<Route
							path="teaching-units/:teachingUnitId"
							element={<TeachingUnitDetail />}
						/>
						<Route path="notifications" element={<NotificationsCenter />} />
						<Route path="api-keys" element={<ApiKeysManagement />} />
						{/* Deliberations */}
						<Route path="deliberations" element={<DeliberationsList />} />
						<Route
							path="deliberations/:deliberationId"
							element={<DeliberationDetail />}
						/>
						<Route path="deliberations/rules" element={<DeliberationRules />} />
						{/* Promotion Rules */}
						<Route
							path="promotion-rules"
							element={<PromotionRulesDashboard />}
						/>
						<Route path="promotion-rules/rules" element={<RulesListPage />} />
						<Route
							path="promotion-rules/evaluate"
							element={<EvaluatePromotionPage />}
						/>
						<Route
							path="promotion-rules/execute"
							element={<ExecutePromotionPage />}
						/>
						<Route
							path="promotion-rules/history"
							element={<ExecutionHistoryPage />}
						/>
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
						<Route path="grades" element={<GradeEntry />} />
						<Route path="grades/:courseId" element={<GradeEntry />} />
						<Route
							path="grades/:courseId/fast"
							element={<GradeSpreadsheet basePath="/teacher" />}
						/>
						<Route path="attendance" element={<AttendanceAlerts />} />
						<Route path="workflows" element={<WorkflowManager />} />
					</Route>

					{/* Grade Editor Routes */}
					<Route path="/grade-editor" element={<DashboardLayout />}>
						<Route index element={<TeacherDashboard />} />
						<Route
							path="courses"
							element={<CourseList basePath="/grade-editor" />}
						/>
						<Route path="grades" element={<GradeEntry />} />
						<Route path="grades/:courseId" element={<GradeEntry />} />
						<Route
							path="grades/:courseId/fast"
							element={<GradeSpreadsheet basePath="/grade-editor" />}
						/>
					</Route>

					{/* Student Routes */}
					<Route path="/student" element={<DashboardLayout />}>
						<Route index element={<PerformanceDashboard />} />
					</Route>

					{/* Shared Settings */}
					<Route path="/settings" element={<DashboardLayout />}>
						<Route index element={<AccountSettings />} />
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

const allowedRoles: BusinessRole[] = [
	"guest",
	"student",
	"staff",
	"grade_editor",
	"dean",
	"teacher",
	"administrator",
	"super_admin",
	"owner",
];

function normalizeRole(role: string | null | undefined): BusinessRole {
	if (!role) return "guest";
	if (allowedRoles.includes(role as BusinessRole)) {
		return role as BusinessRole;
	}
	return "guest";
}

export default App;
