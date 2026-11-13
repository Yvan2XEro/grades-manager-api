import { Navigate, Route } from "react-router";
import FacultyManagement from "./FacultyManagement";
import InstitutionHub from "./InstitutionHub";
import InstitutionSettings from "./InstitutionSettings";
import StudyCycleDetail from "./StudyCycleDetail";
import StudyCycleDetailsTab from "./StudyCycleDetailsTab";
import StudyCycleLevelsTab from "./StudyCycleLevelsTab";
import StudyCycleManagement from "./StudyCycleManagement";

export const institutionRoutes = (
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
);
