import { Route } from "react-router";
import { RoleView } from "@/components/navigation/RoleView";
import TeacherHub from "@/modules/grades/pages/teacher-home-page";
import AdminDashboard from "./pages/admin-dashboard";
import CohortDashboard from "./pages/cohort-dashboard";
import PerformanceDashboard from "./pages/performance-dashboard";

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
