import { Navigate, Route } from "react-router";
import FacultiesPage from "./pages/faculties-page";
import InstitutionLayout from "./pages/institution-layout";
import InstitutionSettingsPage from "./pages/institution-settings-page";
import StudyCycleDetailDetails from "./pages/study-cycle-detail/study-cycle-detail-details";
import StudyCycleDetailLayout from "./pages/study-cycle-detail/study-cycle-detail-layout";
import StudyCycleDetailLevels from "./pages/study-cycle-detail/study-cycle-detail-levels";
import StudyCyclesPage from "./pages/study-cycles-page";

export const institutionRoutes = (
	<Route path="institution">
		<Route element={<InstitutionLayout />}>
			<Route index element={<Navigate to="overview" replace />} />
			<Route path="overview" element={<InstitutionSettingsPage />} />
			<Route path="faculties" element={<FacultiesPage />} />
			<Route path="cycles" element={<StudyCyclesPage />} />
		</Route>
		<Route path="cycles/:cycleId" element={<StudyCycleDetailLayout />}>
			<Route index element={<Navigate to="levels" replace />} />
			<Route path="details" element={<StudyCycleDetailDetails />} />
			<Route path="levels" element={<StudyCycleDetailLevels />} />
		</Route>
	</Route>
);
