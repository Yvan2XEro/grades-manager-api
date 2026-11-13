import { Navigate, Route } from "react-router";
import GradeEntry from "./GradeEntry";
import GradeSpreadsheet from "./GradeSpreadsheet";
import TeacherGradeExport from "./TeacherGradeExport";

/** Grade entry for teachers and grade editors (their course list is the home page). */
export const gradesRoutes = (
	<>
		<Route path="grades" element={<Navigate to="/" replace />} />
		<Route path="grades/:courseId" element={<GradeEntry />} />
		<Route path="grades/:courseId/fast" element={<GradeSpreadsheet />} />
		<Route path="exports" element={<TeacherGradeExport />} />
	</>
);
