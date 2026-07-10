import { useEffect, useMemo, useRef } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { Redirector } from "./components/navigation/Redirector";
import LoadingScreen from "./components/ui/LoadingScreen";
import { authClient } from "./lib/auth-client";
import { detectOrganizationSlug } from "./lib/organization";
import AccountSettings from "./pages/AccountSettings";
import AcademicResultsHub from "./pages/admin/AcademicResultsHub";
import AcademicYearManagement from "./pages/admin/AcademicYearManagement";
import AcademicYearTransitions from "./pages/admin/AcademicYearTransitions";
import AdmissionsManagement from "./pages/admin/AdmissionsManagement";
import ApiKeysManagement from "./pages/admin/ApiKeysManagement";
import AttendanceManagement from "./pages/admin/attendance/AttendanceManagement";
import AttendanceRates from "./pages/admin/attendance/AttendanceRates";
import ClassAttendanceOverview from "./pages/admin/attendance/ClassAttendanceOverview";
import BulkDocumentGeneration from "./pages/admin/BulkDocumentGeneration";
import BatchJobDetail from "./pages/admin/batch-jobs/BatchJobDetail";
import BatchJobsDashboard from "./pages/admin/batch-jobs/BatchJobsDashboard";
import CenterManagement from "./pages/admin/CenterManagement";
import ClassCourseManagement from "./pages/admin/ClassCourseManagement";
import ClassDocumentTemplates from "./pages/admin/ClassDocumentTemplates";
import ClassesHub from "./pages/admin/ClassesHub";
import ClassManagement from "./pages/admin/ClassManagement";
import ConfigurationHub from "./pages/admin/ConfigurationHub";
import CourseManagement from "./pages/admin/CourseManagement";
import {
	CenterAuthorizationTab,
	CenterContactTab,
	CenterDetail,
	CenterIdentityTab,
	CenterInstancesTab,
	CenterLogosTab,
} from "./pages/admin/centers";
import AdminDashboard from "./pages/admin/Dashboard";
import {
	DeliberationActivityTab,
	DeliberationDetail,
	DeliberationJuryTab,
	DeliberationLegacyRedirect,
	DeliberationResultsTab,
	DeliberationRules,
	DeliberationsList,
} from "./pages/admin/deliberations";
import TransitionDetail from "./pages/admin/deliberations/TransitionDetail";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";
import ExamManagement from "./pages/admin/ExamManagement";
import ExamParticipationRoster from "./pages/admin/ExamParticipationRoster";
import ExamScheduler from "./pages/admin/ExamScheduler";
import ExamsHub from "./pages/admin/ExamsHub";
import ExamTypes from "./pages/admin/ExamTypes";
import ExportTemplateEditor from "./pages/admin/ExportTemplateEditor";
import ExportTemplatesManagement from "./pages/admin/ExportTemplatesManagement";
import FacultyManagement from "./pages/admin/FacultyManagement";
import FeeAssignmentDetail from "./pages/admin/fee-clearance/FeeAssignmentDetail";
import FeeAssignmentsList from "./pages/admin/fee-clearance/FeeAssignmentsList";
import FeeClearanceHub from "./pages/admin/fee-clearance/FeeClearanceHub";
import FeeGatingSettings from "./pages/admin/fee-clearance/FeeGatingSettings";
import FeeStructureAssignmentsTab from "./pages/admin/fee-clearance/FeeStructureAssignmentsTab";
import FeeStructureDetail from "./pages/admin/fee-clearance/FeeStructureDetail";
import FeeStructureDetailsTab from "./pages/admin/fee-clearance/FeeStructureDetailsTab";
import FeeStructureImpactTab from "./pages/admin/fee-clearance/FeeStructureImpactTab";
import FeeStructureInstallmentsTab from "./pages/admin/fee-clearance/FeeStructureInstallmentsTab";
import FeeStructuresList from "./pages/admin/fee-clearance/FeeStructuresList";
import StudentFinancialHistory from "./pages/admin/fee-clearance/StudentFinancialHistory";
import GradeAccessGrants from "./pages/admin/GradeAccessGrants";
import GradeExport from "./pages/admin/GradeExport";
import GradeScaleSettings from "./pages/admin/GradeScaleSettings";
import GraduatedStudents from "./pages/admin/GraduatedStudents";
import GuardiansManagement from "./pages/admin/GuardiansManagement";
import InstitutionHub from "./pages/admin/InstitutionHub";
import InstitutionSettings from "./pages/admin/InstitutionSettings";
import MonitoringDashboard from "./pages/admin/MonitoringDashboard";
import NotificationsCenter from "./pages/admin/NotificationsCenter";
import ProgramsHub from "./pages/admin/ProgramsHub";
import PromotionHub from "./pages/admin/PromotionHub";
import {
	ProfileEnrollmentsTab,
	ProfileFinancesTab,
	ProfileGuardiansTab,
	ProfileHub,
	ProfileIdentityTab,
	ProfileResultsTab,
} from "./pages/admin/profiles";
import RegistrationNumberFormatDetail from "./pages/admin/RegistrationNumberFormatDetail";
import RegistrationNumberFormats from "./pages/admin/RegistrationNumberFormats";
import RetakeEligibility from "./pages/admin/RetakeEligibility";
import RoomsManagement from "./pages/admin/RoomsManagement";
import RuleManagement from "./pages/admin/RuleManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import StudyCycleManagement from "./pages/admin/StudyCycleManagement";
import TeachingUnitCoursesTab from "./pages/admin/TeachingUnitCoursesTab";
import TeachingUnitDetail from "./pages/admin/TeachingUnitDetail";
import TeachingUnitDetailsTab from "./pages/admin/TeachingUnitDetailsTab";
import TeachingUnitManagement from "./pages/admin/TeachingUnitManagement";
import TimetableHub from "./pages/admin/TimetableHub";
import TimetableManagement from "./pages/admin/TimetableManagement";
import UserManagement from "./pages/admin/UserManagement";
import UsersHub from "./pages/admin/UsersHub";
import ApplicationForm from "./pages/admissions/ApplicationForm";
import ApplicationStatus from "./pages/admissions/ApplicationStatus";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import ApprovalHistory from "./pages/dean/ApprovalHistory";
import CohortDashboard from "./pages/dean/CohortDashboard";
import DeanDashboard from "./pages/dean/DeanDashboard";
import WorkflowApprovals from "./pages/dean/WorkflowApprovals";
import GuardianPortal from "./pages/guardian/GuardianPortal";
import NotificationsPage from "./pages/NotificationsPage";
import AccountTab from "./pages/settings/AccountTab";
import PreferencesTab from "./pages/settings/PreferencesTab";
import ProfileTab from "./pages/settings/ProfileTab";
import AcademicTimeline from "./pages/student/AcademicTimeline";
import CourseEnrollment from "./pages/student/CourseEnrollment";
import DocumentsPage from "./pages/student/DocumentsPage";
import ExamCalendar from "./pages/student/ExamCalendar";
import PerformanceDashboard from "./pages/student/PerformanceDashboard";
import StudentFeeStatus from "./pages/student/StudentFeeStatus";
import StudentTimetable from "./pages/student/Timetable";
import AttendanceAlerts from "./pages/teacher/AttendanceAlerts";
import TeacherAttendanceRates from "./pages/teacher/AttendanceRates";
import GradeEntry from "./pages/teacher/GradeEntry";
import TeacherGradeExport from "./pages/teacher/GradeExport";
import GradeSpreadsheet from "./pages/teacher/GradeSpreadsheet";
import ProgramManagement from "./pages/teacher/ProgramManagement";
import TeacherHub from "./pages/teacher/TeacherHub";
import TeacherTimetable from "./pages/teacher/Timetable";
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
			<Route path="/admissions/apply" element={<ApplicationForm />} />
			<Route path="/admissions/status" element={<ApplicationStatus />} />
			<Route path="/guardian/portal" element={<GuardianPortal />} />

			{!!memoUser && (
				<>
					{/* Admin Routes */}
					<Route path="/admin" element={<DashboardLayout />}>
						<Route index element={<AdminDashboard />} />
						<Route path="academic-years" element={<AcademicYearManagement />} />
						<Route path="admissions" element={<AdmissionsManagement />} />
						{/* Legacy redirects: standalone → UsersHub tabs */}
						<Route
							path="guardians"
							element={<Navigate to="/admin/users/guardians" replace />}
						/>
						<Route
							path="students"
							element={<Navigate to="/admin/users/students" replace />}
						/>
						<Route path="student-promotion" element={<StudentManagement />} />
						<Route path="graduation" element={<GraduatedStudents />} />
						<Route path="monitoring" element={<MonitoringDashboard />} />
						<Route path="batch-jobs" element={<BatchJobsDashboard />} />
						<Route path="batch-jobs/:jobId" element={<BatchJobDetail />} />
						<Route path="fee-clearance">
							<Route element={<FeeClearanceHub />}>
								<Route index element={<Navigate to="structures" replace />} />
								<Route path="structures" element={<FeeStructuresList />} />
								<Route path="assignments" element={<FeeAssignmentsList />} />
								<Route
									path="assignments/:id"
									element={<FeeAssignmentDetail />}
								/>
								<Route
									path="students/:studentId/history"
									element={<StudentFinancialHistory />}
								/>
								<Route path="gating" element={<FeeGatingSettings />} />
							</Route>
							<Route path="structures/:id" element={<FeeStructureDetail />}>
								<Route index element={<Navigate to="details" replace />} />
								<Route path="details" element={<FeeStructureDetailsTab />} />
								<Route
									path="installments"
									element={<FeeStructureInstallmentsTab />}
								/>
								<Route path="impact" element={<FeeStructureImpactTab />} />
								<Route
									path="assignments"
									element={<FeeStructureAssignmentsTab />}
								/>
							</Route>
						</Route>
						<Route path="notifications" element={<NotificationsCenter />} />

						{/* Legacy redirect: /admin/deliberations/:id → /admin/academic-results/deliberations/:id */}
						<Route
							path="deliberations/:deliberationId"
							element={<DeliberationLegacyRedirect />}
						/>
						<Route path="deliberations/rules" element={<DeliberationRules />} />

						{/* Academic Results hub */}
						<Route path="academic-results">
							<Route element={<AcademicResultsHub />}>
								<Route
									index
									element={<Navigate to="deliberations" replace />}
								/>
								<Route path="deliberations" element={<DeliberationsList />} />
								<Route path="promotion" element={<AcademicYearTransitions />} />
							</Route>
							{/* Deliberation detail with contextual tabs */}
							<Route
								path="deliberations/:deliberationId"
								element={<DeliberationDetail />}
							>
								<Route index element={<Navigate to="results" replace />} />
								<Route path="results" element={<DeliberationResultsTab />} />
								<Route path="jury" element={<DeliberationJuryTab />} />
								<Route path="activity" element={<DeliberationActivityTab />} />
							</Route>
						</Route>

						{/* Transition detail (outside hub) */}
						<Route path="promotion/:id" element={<TransitionDetail />} />

						{/* Institution hub */}
						<Route path="institution" element={<InstitutionHub />}>
							<Route index element={<Navigate to="overview" replace />} />
							<Route path="overview" element={<InstitutionSettings />} />
							<Route path="faculties" element={<FacultyManagement />} />
							<Route path="cycles" element={<StudyCycleManagement />} />
						</Route>

						{/* Programs hub */}
						<Route path="programs">
							<Route element={<ProgramsHub />}>
								<Route index element={<Navigate to="programs" replace />} />
								<Route path="programs" element={<ProgramManagement />} />
								<Route
									path="teaching-units"
									element={<TeachingUnitManagement />}
								/>
								<Route path="courses" element={<CourseManagement />} />
							</Route>
							<Route
								path="teaching-units/:teachingUnitId"
								element={<TeachingUnitDetail />}
							>
								<Route index element={<Navigate to="details" replace />} />
								<Route path="details" element={<TeachingUnitDetailsTab />} />
								<Route path="courses" element={<TeachingUnitCoursesTab />} />
							</Route>
						</Route>

						{/* Classes hub */}
						<Route path="classes" element={<ClassesHub />}>
							<Route index element={<Navigate to="classes" replace />} />
							<Route path="classes" element={<ClassManagement />} />
							<Route path="assignments" element={<ClassCourseManagement />} />
							<Route path="enrollments" element={<EnrollmentManagement />} />
						</Route>

						{/* Users hub */}
						<Route path="users" element={<UsersHub />}>
							<Route index element={<Navigate to="accounts" replace />} />
							<Route path="accounts" element={<UserManagement />} />
							<Route path="students" element={<StudentManagement />} />
							<Route path="guardians" element={<GuardiansManagement />} />
							<Route path="api-keys" element={<ApiKeysManagement />} />
							{/* Legacy: /admin/users/users → /admin/users/accounts */}
							<Route
								path="users"
								element={<Navigate to="/admin/users/accounts" replace />}
							/>
						</Route>

						{/* Profile detail hub */}
						<Route path="profiles/:profileId" element={<ProfileHub />}>
							<Route index element={<Navigate to="identity" replace />} />
							<Route path="identity" element={<ProfileIdentityTab />} />
							<Route path="enrollments" element={<ProfileEnrollmentsTab />} />
							<Route path="results" element={<ProfileResultsTab />} />
							<Route path="finances" element={<ProfileFinancesTab />} />
							<Route path="guardians" element={<ProfileGuardiansTab />} />
						</Route>

						{/* Exams hub (includes grade management) */}
						<Route path="exams" element={<ExamsHub />}>
							<Route index element={<Navigate to="list" replace />} />
							<Route path="list" element={<ExamManagement />} />
							<Route path="types" element={<ExamTypes />} />
							<Route path="scheduler" element={<ExamScheduler />} />
							<Route
								path="participation"
								element={<ExamParticipationRoster />}
							/>
							<Route path="export" element={<GradeExport />} />
							<Route path="access" element={<GradeAccessGrants />} />
							<Route path="retakes" element={<RetakeEligibility />} />
							<Route path="templates" element={<ExportTemplatesManagement />} />
							<Route
								path="class-documents"
								element={<ClassDocumentTemplates />}
							/>
						</Route>

						{/* Legacy: /admin/grades/* → /admin/exams/* */}
						<Route path="grades">
							<Route
								index
								element={<Navigate to="/admin/exams/export" replace />}
							/>
							<Route
								path="export"
								element={<Navigate to="/admin/exams/export" replace />}
							/>
							<Route
								path="access"
								element={<Navigate to="/admin/exams/access" replace />}
							/>
							<Route
								path="retake"
								element={<Navigate to="/admin/exams/retakes" replace />}
							/>
							<Route
								path="templates"
								element={<Navigate to="/admin/exams/templates" replace />}
							/>
							<Route
								path="class-documents"
								element={<Navigate to="/admin/exams/class-documents" replace />}
							/>
						</Route>

						{/* Timetable hub */}
						<Route path="timetable" element={<TimetableHub />}>
							<Route index element={<Navigate to="schedule" replace />} />
							<Route path="schedule" element={<TimetableManagement />} />
							<Route path="rooms" element={<RoomsManagement />} />
							<Route path="attendance" element={<AttendanceManagement />} />
							<Route path="rates" element={<AttendanceRates />} />
							<Route path="overview" element={<ClassAttendanceOverview />} />
						</Route>

						{/* Configuration hub */}
						<Route path="configuration" element={<ConfigurationHub />}>
							<Route index element={<Navigate to="reg-numbers" replace />} />
							<Route
								path="reg-numbers"
								element={<RegistrationNumberFormats />}
							/>
							<Route path="grade-scale" element={<GradeScaleSettings />} />
							<Route path="templates" element={<ExportTemplatesManagement />} />
							<Route path="rules" element={<RuleManagement />} />
						</Route>

						{/* Standalone pages still needed outside hubs */}
						<Route path="centers" element={<CenterManagement />} />
						<Route path="centers/new" element={<CenterDetail />} />
						<Route path="centers/:centerId" element={<CenterDetail />}>
							<Route index element={<Navigate to="identity" replace />} />
							<Route path="identity" element={<CenterIdentityTab />} />
							<Route path="logos" element={<CenterLogosTab />} />
							<Route path="instances" element={<CenterInstancesTab />} />
							<Route
								path="authorization"
								element={<CenterAuthorizationTab />}
							/>
							<Route path="contact" element={<CenterContactTab />} />
						</Route>
						<Route path="document-batch" element={<BulkDocumentGeneration />} />
						<Route
							path="export-templates/:templateId"
							element={<ExportTemplateEditor />}
						/>
						<Route path="promotion-legacy" element={<PromotionHub />} />
						<Route
							path="teaching-units/:teachingUnitId"
							element={<TeachingUnitLegacyRedirect />}
						/>
						<Route
							path="registration-numbers/:formatId"
							element={<RegistrationNumberFormatDetail />}
						/>

						{/* ── Legacy redirects: path-based targets ── */}
						<Route
							path="faculties"
							element={<Navigate to="/admin/institution/faculties" replace />}
						/>
						<Route
							path="study-cycles"
							element={<Navigate to="/admin/institution/cycles" replace />}
						/>
						<Route
							path="teaching-units"
							element={<Navigate to="/admin/programs/teaching-units" replace />}
						/>
						<Route
							path="courses"
							element={<Navigate to="/admin/programs/courses" replace />}
						/>
						<Route
							path="class-courses"
							element={<Navigate to="/admin/classes/assignments" replace />}
						/>
						<Route
							path="enrollments"
							element={<Navigate to="/admin/classes/enrollments" replace />}
						/>
						<Route
							path="api-keys"
							element={<Navigate to="/admin/users/api-keys" replace />}
						/>
						<Route
							path="exam-types"
							element={<Navigate to="/admin/exams/types" replace />}
						/>
						<Route
							path="exam-scheduler"
							element={<Navigate to="/admin/exams/scheduler" replace />}
						/>
						<Route
							path="retake-eligibility"
							element={<Navigate to="/admin/grades/retake" replace />}
						/>
						<Route
							path="grade-export"
							element={<Navigate to="/admin/grades/export" replace />}
						/>
						<Route
							path="grade-access"
							element={<Navigate to="/admin/grades/access" replace />}
						/>
						<Route
							path="export-templates"
							element={<Navigate to="/admin/grades/templates" replace />}
						/>
						<Route
							path="class-document-templates"
							element={<Navigate to="/admin/grades/class-documents" replace />}
						/>
						<Route
							path="rules"
							element={<Navigate to="/admin/configuration/rules" replace />}
						/>
						<Route
							path="registration-numbers"
							element={
								<Navigate to="/admin/configuration/reg-numbers" replace />
							}
						/>
						<Route
							path="deliberations"
							element={
								<Navigate to="/admin/academic-results/deliberations" replace />
							}
						/>
						<Route
							path="promotion"
							element={
								<Navigate to="/admin/academic-results/promotion" replace />
							}
						/>
						<Route
							path="promotion-rules"
							element={<Navigate to="/admin/promotion-legacy" replace />}
						/>
						<Route
							path="promotion-rules/rules"
							element={
								<Navigate to="/admin/promotion-legacy?tab=rules" replace />
							}
						/>
						<Route
							path="promotion-rules/evaluate"
							element={
								<Navigate to="/admin/promotion-legacy?tab=evaluate" replace />
							}
						/>
						<Route
							path="promotion-rules/execute"
							element={
								<Navigate to="/admin/promotion-legacy?tab=execute" replace />
							}
						/>
						<Route
							path="promotion-rules/history"
							element={
								<Navigate to="/admin/promotion-legacy?tab=history" replace />
							}
						/>
					</Route>

					{/* Dean Routes */}
					<Route path="/dean" element={<DashboardLayout />}>
						<Route index element={<CohortDashboard />} />
						<Route path="approvals" element={<DeanDashboard />} />
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
							element={<GradeEntry basePath="/teacher" />}
						/>
						<Route
							path="grades/:courseId/fast"
							element={<GradeSpreadsheet basePath="/teacher" />}
						/>
						<Route path="attendance" element={<AttendanceManagement />} />
						<Route path="attendance/alerts" element={<AttendanceAlerts />} />
						<Route
							path="attendance/rates"
							element={<TeacherAttendanceRates />}
						/>
						<Route path="timetable" element={<TeacherTimetable />} />
						<Route path="workflows" element={<WorkflowManager />} />
						<Route path="exports" element={<TeacherGradeExport />} />
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
							element={<GradeEntry basePath="/grade-editor" />}
						/>
						<Route
							path="grades/:courseId/fast"
							element={<GradeSpreadsheet basePath="/grade-editor" />}
						/>
						<Route path="exports" element={<TeacherGradeExport />} />
					</Route>

					{/* Student Routes */}
					<Route path="/student" element={<DashboardLayout />}>
						<Route index element={<PerformanceDashboard />} />
						<Route path="exams" element={<ExamCalendar />} />
						<Route path="timetable" element={<StudentTimetable />} />
						<Route path="enrollments" element={<CourseEnrollment />} />
						<Route path="fees" element={<StudentFeeStatus />} />
						<Route path="documents" element={<DocumentsPage />} />
						<Route path="timeline" element={<AcademicTimeline />} />
					</Route>

					{/* Shared Notifications */}
					<Route path="/notifications" element={<DashboardLayout />}>
						<Route index element={<NotificationsPage />} />
					</Route>

					{/* Shared Settings */}
					<Route path="/settings" element={<DashboardLayout />}>
						<Route element={<AccountSettings />}>
							<Route index element={<Navigate to="account" replace />} />
							<Route path="account" element={<AccountTab />} />
							<Route path="profile" element={<ProfileTab />} />
							<Route path="preferences" element={<PreferencesTab />} />
						</Route>
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

function TeachingUnitLegacyRedirect() {
	const { teachingUnitId } = useParams<{ teachingUnitId: string }>();
	return (
		<Navigate
			to={`/admin/programs/teaching-units/${teachingUnitId}/details`}
			replace
		/>
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
