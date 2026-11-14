import { Route } from "react-router";
import { RoleView } from "@/components/navigation/RoleView";
import TeacherHub from "@/modules/grades/pages/teacher-home-page";
import AdminDashboard from "./AdminDashboard";
import CohortDashboard from "./CohortDashboard";
import PerformanceDashboard from "./PerformanceDashboard";

/** Home page: each role group lands on its own dashboard at `/`. */
export const dashboardRoutes = (
	<Route
		index
		element={
			<RoleView
				fallback={<AdminDashboard />}
				dean={<CohortDashboard />}
				teacher={<TeacherHub />}
				student={<PerformanceDashboard />}
			/>
		}
	/>
);
