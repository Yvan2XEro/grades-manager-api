import { useEffect, useMemo, useRef } from "react";
import { Navigate, Route, Routes } from "react-router";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { Redirector } from "./components/navigation/Redirector";
import LoadingScreen from "./components/ui/LoadingScreen";
import { authClient } from "./lib/auth-client";
import { detectOrganizationSlug } from "./lib/organization";
import AccountSettings from "./pages/AccountSettings";
import AcademicYearManagement from "./pages/admin/AcademicYearManagement";
import BatchJobDetail from "./pages/admin/batch-jobs/BatchJobDetail";
import BatchJobsDashboard from "./pages/admin/batch-jobs/BatchJobsDashboard";
import ClassesHub from "./pages/admin/ClassesHub";
import ConfigurationHub from "./pages/admin/ConfigurationHub";
import AdminDashboard from "./pages/admin/Dashboard";
import {
	DeliberationDetail,
	DeliberationRules,
	DeliberationsList,
} from "./pages/admin/deliberations";
import ExamsHub from "./pages/admin/ExamsHub";
import GradesHub from "./pages/admin/GradesHub";
import GraduatedStudents from "./pages/admin/GraduatedStudents";
import InstitutionHub from "./pages/admin/InstitutionHub";
import MonitoringDashboard from "./pages/admin/MonitoringDashboard";
import NotificationsCenter from "./pages/admin/NotificationsCenter";
import ProgramsHub from "./pages/admin/ProgramsHub";
import PromotionHub from "./pages/admin/PromotionHub";
import StudentManagement from "./pages/admin/StudentManagement";
import UsersHub from "./pages/admin/UsersHub";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import ApprovalHistory from "./pages/dean/ApprovalHistory";
import DeanDashboard from "./pages/dean/DeanDashboard";
import WorkflowApprovals from "./pages/dean/WorkflowApprovals";
import PerformanceDashboard from "./pages/student/PerformanceDashboard";
import AttendanceAlerts from "./pages/teacher/AttendanceAlerts";
import TeacherHub from "./pages/teacher/TeacherHub";
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
						<Route path="academic-years" element={<AcademicYearManagement />} />
						<Route path="students" element={<StudentManagement />} />
						<Route path="student-promotion" element={<StudentManagement />} />
						<Route path="graduation" element={<GraduatedStudents />} />
						<Route path="monitoring" element={<MonitoringDashboard />} />
						<Route path="batch-jobs" element={<BatchJobsDashboard />} />
						<Route path="batch-jobs/:jobId" element={<BatchJobDetail />} />
						<Route path="notifications" element={<NotificationsCenter />} />
						{/* Deliberations */}
						<Route path="deliberations" element={<DeliberationsList />} />
						<Route
							path="deliberations/:deliberationId"
							element={<DeliberationDetail />}
						/>
						<Route path="deliberations/rules" element={<DeliberationRules />} />

						{/* Hub pages */}
						<Route path="institution" element={<InstitutionHub />} />
						<Route path="programs" element={<ProgramsHub />} />
						<Route path="classes" element={<ClassesHub />} />
						<Route path="users" element={<UsersHub />} />
						<Route path="exams" element={<ExamsHub />} />
						<Route path="grades" element={<GradesHub />} />
						<Route path="promotion" element={<PromotionHub />} />
						<Route path="configuration" element={<ConfigurationHub />} />

						{/* Redirects: old routes → hub pages */}
						<Route
							path="faculties"
							element={
								<Navigate to="/admin/institution?tab=faculties" replace />
							}
						/>
						<Route
							path="study-cycles"
							element={<Navigate to="/admin/institution?tab=cycles" replace />}
						/>
						<Route
							path="teaching-units"
							element={
								<Navigate to="/admin/programs?tab=teaching-units" replace />
							}
						/>
						<Route
							path="teaching-units/:teachingUnitId"
							element={
								<Navigate to="/admin/programs?tab=teaching-units" replace />
							}
						/>
						<Route
							path="courses"
							element={<Navigate to="/admin/programs?tab=courses" replace />}
						/>
						<Route
							path="class-courses"
							element={<Navigate to="/admin/classes?tab=assignments" replace />}
						/>
						<Route
							path="enrollments"
							element={<Navigate to="/admin/classes?tab=enrollments" replace />}
						/>
						<Route
							path="api-keys"
							element={<Navigate to="/admin/users?tab=api-keys" replace />}
						/>
						<Route
							path="exam-types"
							element={<Navigate to="/admin/exams?tab=types" replace />}
						/>
						<Route
							path="exam-scheduler"
							element={<Navigate to="/admin/exams?tab=scheduler" replace />}
						/>
						<Route
							path="retake-eligibility"
							element={<Navigate to="/admin/grades?tab=retake" replace />}
						/>
						<Route
							path="grade-export"
							element={<Navigate to="/admin/grades?tab=export" replace />}
						/>
						<Route
							path="grade-access"
							element={<Navigate to="/admin/grades?tab=access" replace />}
						/>
						<Route
							path="rules"
							element={<Navigate to="/admin/configuration?tab=rules" replace />}
						/>
						<Route
							path="registration-numbers"
							element={
								<Navigate to="/admin/configuration?tab=reg-numbers" replace />
							}
						/>
						<Route
							path="registration-numbers/:formatId"
							element={
								<Navigate to="/admin/configuration?tab=reg-numbers" replace />
							}
						/>
						<Route
							path="export-templates"
							element={
								<Navigate to="/admin/configuration?tab=templates" replace />
							}
						/>
						<Route
							path="export-templates/:templateId"
							element={
								<Navigate to="/admin/configuration?tab=templates" replace />
							}
						/>
						<Route
							path="promotion-rules"
							element={<Navigate to="/admin/promotion?tab=overview" replace />}
						/>
						<Route
							path="promotion-rules/rules"
							element={<Navigate to="/admin/promotion?tab=rules" replace />}
						/>
						<Route
							path="promotion-rules/evaluate"
							element={<Navigate to="/admin/promotion?tab=evaluate" replace />}
						/>
						<Route
							path="promotion-rules/execute"
							element={<Navigate to="/admin/promotion?tab=execute" replace />}
						/>
						<Route
							path="promotion-rules/history"
							element={<Navigate to="/admin/promotion?tab=history" replace />}
						/>
					</Route>

					{/* Dean Routes */}
					<Route path="/dean" element={<DashboardLayout />}>
						<Route index element={<DeanDashboard />} />
						<Route path="workflows" element={<WorkflowApprovals />} />
						<Route path="history" element={<ApprovalHistory />} />
						<Route path="monitoring" element={<MonitoringDashboard />} />
					</Route>

					{/* Teacher Routes */}
					<Route path="/teacher" element={<DashboardLayout />}>
						<Route index element={<TeacherHub />} />
						{/* Legacy routes kept for backward compatibility */}
						<Route
							path="courses"
							element={<Navigate to="/teacher" replace />}
						/>
						<Route path="grades" element={<Navigate to="/teacher" replace />} />
						<Route
							path="grades/:courseId"
							element={<Navigate to="/teacher" replace />}
						/>
						<Route path="attendance" element={<AttendanceAlerts />} />
						<Route path="workflows" element={<WorkflowManager />} />
						<Route
							path="exports"
							element={<Navigate to="/teacher" replace />}
						/>
					</Route>

					{/* Grade Editor Routes */}
					<Route path="/grade-editor" element={<DashboardLayout />}>
						<Route index element={<TeacherHub basePath="/grade-editor" />} />
						<Route
							path="courses"
							element={<Navigate to="/grade-editor" replace />}
						/>
						<Route
							path="grades"
							element={<Navigate to="/grade-editor" replace />}
						/>
						<Route
							path="grades/:courseId"
							element={<Navigate to="/grade-editor" replace />}
						/>
						<Route
							path="exports"
							element={<Navigate to="/grade-editor" replace />}
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
