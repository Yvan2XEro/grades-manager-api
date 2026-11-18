import { Navigate, Route } from "react-router";
import { RoleView } from "@/components/navigation/RoleView";
import CourseEnrollmentPage from "./pages/course-enrollment-page";

/** Students enroll in courses here; staff manage enrollments in the classes hub. */
export const enrollmentsRoutes = (
	<Route
		path="enrollments"
		element={
			<RoleView
				fallback={<Navigate to="/classes/enrollments" replace />}
				student={<CourseEnrollmentPage />}
			/>
		}
	/>
);
