import { Navigate, Route } from "react-router";
import { RoleView } from "@/components/navigation/RoleView";
import ClassDocumentTemplates from "@/modules/documents/ClassDocumentTemplates";
import ExportTemplatesManagement from "@/modules/documents/ExportTemplatesManagement";
import GradeAccessGrants from "@/modules/grades/GradeAccessGrants";
import GradeExport from "@/modules/grades/GradeExport";
import ExamCalendarPage from "./pages/exam-calendar-page";
import ExamParticipationPage from "./pages/exam-participation-page";
import ExamSchedulerPage from "./pages/exam-scheduler-page";
import ExamTypesPage from "./pages/exam-types-page";
import ExamsLayout from "./pages/exams-layout";
import ExamsPage from "./pages/exams-page";
import RetakeEligibilityPage from "./pages/retake-eligibility-page";

/** Exams hub (includes grade management); students get their exam calendar. */
export const examsRoutes = (
	<Route
		path="exams"
		element={
			<RoleView fallback={<ExamsLayout />} student={<ExamCalendarPage />} />
		}
	>
		<Route index element={<Navigate to="list" replace />} />
		<Route path="list" element={<ExamsPage />} />
		<Route path="types" element={<ExamTypesPage />} />
		<Route path="scheduler" element={<ExamSchedulerPage />} />
		<Route path="participation" element={<ExamParticipationPage />} />
		<Route path="export" element={<GradeExport />} />
		<Route path="access" element={<GradeAccessGrants />} />
		<Route path="retakes" element={<RetakeEligibilityPage />} />
		<Route path="templates" element={<ExportTemplatesManagement />} />
		<Route path="class-documents" element={<ClassDocumentTemplates />} />
	</Route>
);
