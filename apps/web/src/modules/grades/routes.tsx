import { Navigate, Route } from "react-router";
import GradeEntry from "./pages/grade-entry-page";
import GradeSpreadsheet from "./pages/grade-spreadsheet-page";
import TeacherGradeExport from "./pages/teacher-grade-export-page";

/** Grade entry for teachers and grade editors (their course list is the home page). */
export const gradesRoutes = (
	<>
		<Route path="grades" element={<Navigate to="/" replace />} />
		<Route path="grades/:courseId" element={<GradeEntry />} />
		<Route path="grades/:courseId/fast" element={<GradeSpreadsheet />} />
		<Route path="exports" element={<TeacherGradeExport />} />
	</>
);
