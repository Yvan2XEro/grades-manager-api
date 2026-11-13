import { useEffect, useMemo, useRef } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";
import AcademicYearManagement from "@/modules/academic-years/AcademicYearManagement";
import AdmissionDetail from "@/modules/admissions/AdmissionDetail";
import AdmissionsManagement from "@/modules/admissions/AdmissionsManagement";
import ApplicationForm from "@/modules/admissions/ApplicationForm";
import ApplicationStatus from "@/modules/admissions/ApplicationStatus";
import ApiKeysManagement from "@/modules/api-keys/ApiKeysManagement";
import AttendanceAlerts from "@/modules/attendance/AttendanceAlerts";
import AttendanceManagement from "@/modules/attendance/AttendanceManagement";
import AttendanceRates from "@/modules/attendance/AttendanceRates";
import ClassAttendanceOverview from "@/modules/attendance/ClassAttendanceOverview";
import TeacherAttendanceRates from "@/modules/attendance/TeacherAttendanceRates";
import ForgotPassword from "@/modules/auth/ForgotPassword";
import Login from "@/modules/auth/Login";
import Register from "@/modules/auth/Register";
import ResetPassword from "@/modules/auth/ResetPassword";
import BatchJobDetail from "@/modules/batch-jobs/BatchJobDetail";
import BatchJobsDashboard from "@/modules/batch-jobs/BatchJobsDashboard";
import {
	CenterAuthorizationTab,
	CenterContactTab,
	CenterDetail,
	CenterIdentityTab,
	CenterInstancesTab,
	CenterLogosTab,
} from "@/modules/centers";
import CenterManagement from "@/modules/centers/CenterManagement";
import ClassCourseManagement from "@/modules/classes/ClassCourseManagement";
import ClassCoursesTab from "@/modules/classes/ClassCoursesTab";
import ClassDetail from "@/modules/classes/ClassDetail";
import ClassDetailsTab from "@/modules/classes/ClassDetailsTab";
import ClassesHub from "@/modules/classes/ClassesHub";
import ClassManagement from "@/modules/classes/ClassManagement";
import ClassStudentsTab from "@/modules/classes/ClassStudentsTab";
import ConfigurationHub from "@/modules/configuration/ConfigurationHub";
import GradeScaleSettings from "@/modules/configuration/GradeScaleSettings";
import RegistrationNumberFormatDetail from "@/modules/configuration/RegistrationNumberFormatDetail";
import RegistrationNumberFormats from "@/modules/configuration/RegistrationNumberFormats";
import RuleManagement from "@/modules/configuration/RuleManagement";
import AdminDashboard from "@/modules/dashboard/AdminDashboard";
import CohortDashboard from "@/modules/dashboard/CohortDashboard";
import PerformanceDashboard from "@/modules/dashboard/PerformanceDashboard";
import DataImportHub from "@/modules/data-import/DataImportHub";
import {
	DeliberationActivityTab,
	DeliberationDetail,
	DeliberationJuryTab,
	DeliberationLegacyRedirect,
	DeliberationResultsTab,
	DeliberationRules,
	DeliberationsList,
} from "@/modules/deliberations";
import AcademicResultsHub from "@/modules/deliberations/AcademicResultsHub";
import AcademicYearTransitions from "@/modules/deliberations/AcademicYearTransitions";
import GraduatedStudents from "@/modules/deliberations/GraduatedStudents";
import TransitionDetail from "@/modules/deliberations/TransitionDetail";
import BulkDocumentGeneration from "@/modules/documents/BulkDocumentGeneration";
import ClassDocumentTemplates from "@/modules/documents/ClassDocumentTemplates";
import DocumentsPage from "@/modules/documents/DocumentsPage";
import ExportTemplateEditor from "@/modules/documents/ExportTemplateEditor";
import ExportTemplatesManagement from "@/modules/documents/ExportTemplatesManagement";
import CourseEnrollment from "@/modules/enrollments/CourseEnrollment";
import EnrollmentManagement from "@/modules/enrollments/EnrollmentManagement";
import ExamCalendar from "@/modules/exams/ExamCalendar";
import ExamManagement from "@/modules/exams/ExamManagement";
import ExamParticipationRoster from "@/modules/exams/ExamParticipationRoster";
import ExamScheduler from "@/modules/exams/ExamScheduler";
import ExamsHub from "@/modules/exams/ExamsHub";
import ExamTypes from "@/modules/exams/ExamTypes";
import RetakeEligibility from "@/modules/exams/RetakeEligibility";
import FeeAssignmentDetail from "@/modules/fees/FeeAssignmentDetail";
import FeeAssignmentsList from "@/modules/fees/FeeAssignmentsList";
import FeeClearanceHub from "@/modules/fees/FeeClearanceHub";
import FeeGatingSettings from "@/modules/fees/FeeGatingSettings";
import FeeStructureAssignmentsTab from "@/modules/fees/FeeStructureAssignmentsTab";
import FeeStructureDetail from "@/modules/fees/FeeStructureDetail";
import FeeStructureDetailsTab from "@/modules/fees/FeeStructureDetailsTab";
import FeeStructureImpactTab from "@/modules/fees/FeeStructureImpactTab";
import FeeStructureInstallmentsTab from "@/modules/fees/FeeStructureInstallmentsTab";
import FeeStructuresList from "@/modules/fees/FeeStructuresList";
import StudentFeeStatus from "@/modules/fees/StudentFeeStatus";
import StudentFinancialHistory from "@/modules/fees/StudentFinancialHistory";
import GradeAccessGrants from "@/modules/grades/GradeAccessGrants";
import GradeEntry from "@/modules/grades/GradeEntry";
import GradeExport from "@/modules/grades/GradeExport";
import GradeSpreadsheet from "@/modules/grades/GradeSpreadsheet";
import TeacherGradeExport from "@/modules/grades/TeacherGradeExport";
import TeacherHub from "@/modules/grades/TeacherHub";
import GuardianDirectory from "@/modules/guardians/GuardianDirectory";
import GuardianPortal from "@/modules/guardians/GuardianPortal";
import FacultyManagement from "@/modules/institution/FacultyManagement";
import InstitutionHub from "@/modules/institution/InstitutionHub";
import InstitutionSettings from "@/modules/institution/InstitutionSettings";
import StudyCycleDetail from "@/modules/institution/StudyCycleDetail";
import StudyCycleDetailsTab from "@/modules/institution/StudyCycleDetailsTab";
import StudyCycleLevelsTab from "@/modules/institution/StudyCycleLevelsTab";
import StudyCycleManagement from "@/modules/institution/StudyCycleManagement";
import MonitoringDashboard from "@/modules/monitoring/MonitoringDashboard";
import NotificationsCenter from "@/modules/notifications/NotificationsCenter";
import NotificationsPage from "@/modules/notifications/NotificationsPage";
import {
	ProfileAccessTab,
	ProfileEnrollmentsTab,
	ProfileFinancesTab,
	ProfileGuardiansTab,
	ProfileHub,
	ProfileIdentityTab,
	ProfileResultsTab,
} from "@/modules/people";
import AcademicTimeline from "@/modules/people/AcademicTimeline";
import PeopleManagement from "@/modules/people/PeopleManagement";
import UsersHub from "@/modules/people/UsersHub";
import CourseManagement from "@/modules/programs/CourseManagement";
import ProgramDetail from "@/modules/programs/ProgramDetail";
import ProgramDetailsTab from "@/modules/programs/ProgramDetailsTab";
import ProgramExportTemplatesTab from "@/modules/programs/ProgramExportTemplatesTab";
import ProgramManagement from "@/modules/programs/ProgramManagement";
import ProgramOptionsTab from "@/modules/programs/ProgramOptionsTab";
import ProgramsHub from "@/modules/programs/ProgramsHub";
import TeachingUnitCoursesTab from "@/modules/programs/TeachingUnitCoursesTab";
import TeachingUnitDetail from "@/modules/programs/TeachingUnitDetail";
import TeachingUnitDetailsTab from "@/modules/programs/TeachingUnitDetailsTab";
import TeachingUnitManagement from "@/modules/programs/TeachingUnitManagement";
import PromotionHub from "@/modules/promotion-rules/PromotionHub";
import AccountSettings from "@/modules/settings/AccountSettings";
import AccountTab from "@/modules/settings/AccountTab";
import PreferencesTab from "@/modules/settings/PreferencesTab";
import ProfileTab from "@/modules/settings/ProfileTab";
import StatisticsHub from "@/modules/statistics/StatisticsHub";
import RoomsManagement from "@/modules/timetable/RoomsManagement";
import StudentTimetable from "@/modules/timetable/StudentTimetable";
import TeacherTimetable from "@/modules/timetable/TeacherTimetable";
import TimetableHub from "@/modules/timetable/TimetableHub";
import TimetableManagement from "@/modules/timetable/TimetableManagement";
import ApprovalHistory from "@/modules/workflows/ApprovalHistory";
import DeanDashboard from "@/modules/workflows/ExamApprovals";
import WorkflowApprovals from "@/modules/workflows/WorkflowApprovals";
import WorkflowManager from "@/modules/workflows/WorkflowManager";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { Redirector } from "./components/navigation/Redirector";
import LoadingScreen from "./components/ui/LoadingScreen";
import { authClient } from "./lib/auth-client";
import { detectOrganizationSlug } from "./lib/organization";
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
						<Route path="admissions/:id" element={<AdmissionDetail />} />
						{/* Legacy redirects: standalone → UsersHub tabs */}
						<Route
							path="guardians"
							element={<Navigate to="/admin/users/guardians" replace />}
						/>
						<Route
							path="students"
							element={<Navigate to="/admin/users/people" replace />}
						/>
						<Route
							path="student-promotion"
							element={<Navigate to="/admin/users/people" replace />}
						/>
						<Route path="graduation" element={<GraduatedStudents />} />
						<Route path="monitoring" element={<MonitoringDashboard />} />
						<Route path="batch-jobs" element={<BatchJobsDashboard />} />
						<Route path="batch-jobs/:jobId" element={<BatchJobDetail />} />
						<Route path="import" element={<DataImportHub />} />
						<Route path="statistics" element={<StatisticsHub />} />
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
						<Route path="institution">
							<Route element={<InstitutionHub />}>
								<Route index element={<Navigate to="overview" replace />} />
								<Route path="overview" element={<InstitutionSettings />} />
								<Route path="faculties" element={<FacultyManagement />} />
								<Route path="cycles" element={<StudyCycleManagement />} />
							</Route>
							<Route path="cycles/:cycleId" element={<StudyCycleDetail />}>
								<Route index element={<Navigate to="levels" replace />} />
								<Route path="details" element={<StudyCycleDetailsTab />} />
								<Route path="levels" element={<StudyCycleLevelsTab />} />
							</Route>
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
							<Route path=":programId" element={<ProgramDetail />}>
								<Route index element={<Navigate to="details" replace />} />
								<Route path="details" element={<ProgramDetailsTab />} />
								<Route path="options" element={<ProgramOptionsTab />} />
								<Route
									path="templates"
									element={<ProgramExportTemplatesTab />}
								/>
							</Route>
						</Route>

						{/* Classes hub */}
						<Route path="classes">
							<Route element={<ClassesHub />}>
								<Route index element={<Navigate to="classes" replace />} />
								<Route path="classes" element={<ClassManagement />} />
								<Route path="assignments" element={<ClassCourseManagement />} />
								<Route path="enrollments" element={<EnrollmentManagement />} />
							</Route>
							<Route path=":classId" element={<ClassDetail />}>
								<Route index element={<Navigate to="details" replace />} />
								<Route path="details" element={<ClassDetailsTab />} />
								<Route path="students" element={<ClassStudentsTab />} />
								<Route path="courses" element={<ClassCoursesTab />} />
							</Route>
						</Route>

						{/* Users hub */}
						<Route path="users" element={<UsersHub />}>
							<Route index element={<Navigate to="people" replace />} />
							<Route path="people" element={<PeopleManagement />} />
							<Route path="guardians" element={<GuardianDirectory />} />
							<Route path="api-keys" element={<ApiKeysManagement />} />
							{/* Legacy redirects */}
							<Route
								path="accounts"
								element={<Navigate to="/admin/users/people" replace />}
							/>
							<Route
								path="students"
								element={<Navigate to="/admin/users/people" replace />}
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
							<Route path="access" element={<ProfileAccessTab />} />
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
