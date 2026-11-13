import { Navigate, Route } from "react-router";
import CourseManagement from "./CourseManagement";
import ProgramDetail from "./ProgramDetail";
import ProgramDetailsTab from "./ProgramDetailsTab";
import ProgramExportTemplatesTab from "./ProgramExportTemplatesTab";
import ProgramManagement from "./ProgramManagement";
import ProgramOptionsTab from "./ProgramOptionsTab";
import ProgramsHub from "./ProgramsHub";
import TeachingUnitCoursesTab from "./TeachingUnitCoursesTab";
import TeachingUnitDetail from "./TeachingUnitDetail";
import TeachingUnitDetailsTab from "./TeachingUnitDetailsTab";
import TeachingUnitManagement from "./TeachingUnitManagement";

export const programsRoutes = (
	<Route path="programs">
		<Route element={<ProgramsHub />}>
			<Route index element={<Navigate to="programs" replace />} />
			<Route path="programs" element={<ProgramManagement />} />
			<Route path="teaching-units" element={<TeachingUnitManagement />} />
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
			<Route path="templates" element={<ProgramExportTemplatesTab />} />
		</Route>
	</Route>
);
