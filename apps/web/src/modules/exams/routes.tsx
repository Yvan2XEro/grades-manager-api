import { Navigate, Route } from "react-router";
import { RoleView } from "@/components/navigation/RoleView";
import ClassDocumentTemplates from "@/modules/documents/pages/class-document-templates-page";
import ExportTemplatesManagement from "@/modules/documents/pages/export-templates-page";
import GradeAccessGrants from "@/modules/grades/GradeAccessGrants";
import GradeExport from "@/modules/grades/GradeExport";
import ExamCalendar from "./ExamCalendar";
import ExamManagement from "./ExamManagement";
import ExamParticipationRoster from "./ExamParticipationRoster";
import ExamScheduler from "./ExamScheduler";
import ExamsHub from "./ExamsHub";
import ExamTypes from "./ExamTypes";
import RetakeEligibility from "./RetakeEligibility";

/** Exams hub (includes grade management); students get their exam calendar. */
export const examsRoutes = (
	<Route
		path="exams"
		element={<RoleView fallback={<ExamsHub />} student={<ExamCalendar />} />}
	>
		<Route index element={<Navigate to="list" replace />} />
		<Route path="list" element={<ExamManagement />} />
		<Route path="types" element={<ExamTypes />} />
		<Route path="scheduler" element={<ExamScheduler />} />
		<Route path="participation" element={<ExamParticipationRoster />} />
		<Route path="export" element={<GradeExport />} />
		<Route path="access" element={<GradeAccessGrants />} />
		<Route path="retakes" element={<RetakeEligibility />} />
		<Route path="templates" element={<ExportTemplatesManagement />} />
		<Route path="class-documents" element={<ClassDocumentTemplates />} />
	</Route>
);
