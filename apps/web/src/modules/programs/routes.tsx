import { Navigate, Route } from "react-router";
import CoursesPage from "./pages/courses-page";
import ProgramDetailDetails from "./pages/program-detail/program-detail-details";
import ProgramDetailLayout from "./pages/program-detail/program-detail-layout";
import ProgramDetailOptions from "./pages/program-detail/program-detail-options";
import ProgramDetailTemplates from "./pages/program-detail/program-detail-templates";
import ProgramsLayout from "./pages/programs-layout";
import ProgramsPage from "./pages/programs-page";
import TeachingUnitDetailCourses from "./pages/teaching-unit-detail/teaching-unit-detail-courses";
import TeachingUnitDetailDetails from "./pages/teaching-unit-detail/teaching-unit-detail-details";
import TeachingUnitDetailLayout from "./pages/teaching-unit-detail/teaching-unit-detail-layout";
import TeachingUnitsPage from "./pages/teaching-units-page";

export const programsRoutes = (
	<Route path="programs">
		<Route element={<ProgramsLayout />}>
			<Route index element={<Navigate to="programs" replace />} />
			<Route path="programs" element={<ProgramsPage />} />
			<Route path="teaching-units" element={<TeachingUnitsPage />} />
			<Route path="courses" element={<CoursesPage />} />
		</Route>
		<Route
			path="teaching-units/:teachingUnitId"
			element={<TeachingUnitDetailLayout />}
		>
			<Route index element={<Navigate to="details" replace />} />
			<Route path="details" element={<TeachingUnitDetailDetails />} />
			<Route path="courses" element={<TeachingUnitDetailCourses />} />
		</Route>
		<Route path=":programId" element={<ProgramDetailLayout />}>
			<Route index element={<Navigate to="details" replace />} />
			<Route path="details" element={<ProgramDetailDetails />} />
			<Route path="options" element={<ProgramDetailOptions />} />
			<Route path="templates" element={<ProgramDetailTemplates />} />
		</Route>
	</Route>
);
