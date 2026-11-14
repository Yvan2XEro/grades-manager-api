import { Navigate, Route } from "react-router";
import AcademicResultsHub from "./pages/academic-results-layout";
import AcademicYearTransitions from "./pages/academic-year-transitions-page";
import DeliberationActivityTab from "./pages/deliberation-detail/deliberation-detail-activity";
import DeliberationJuryTab from "./pages/deliberation-detail/deliberation-detail-jury";
import DeliberationDetail from "./pages/deliberation-detail/deliberation-detail-layout";
import DeliberationResultsTab from "./pages/deliberation-detail/deliberation-detail-results";
import { DeliberationLegacyRedirect } from "./pages/deliberation-legacy-redirect";
import DeliberationRules from "./pages/deliberation-rules-page";
import DeliberationsList from "./pages/deliberations-page";
import GraduatedStudents from "./pages/graduated-students-page";
import TransitionDetail from "./pages/transition-detail-page";

export const deliberationsRoutes = (
	<>
		<Route path="academic-results">
			<Route element={<AcademicResultsHub />}>
				<Route index element={<Navigate to="deliberations" replace />} />
				<Route path="deliberations" element={<DeliberationsList />} />
				<Route path="promotion" element={<AcademicYearTransitions />} />
			</Route>
			<Route
				path="deliberations/:deliberationId"
				element={<DeliberationDetail />}
			>
				<Route index element={<Navigate to="results" replace />} />
				<Route path="results" element={<DeliberationResultsTab />} />
				<Route path="jury" element={<DeliberationJuryTab />} />
				<Route path="activity" element={<DeliberationActivityTab />} />
			</Route>
		</Route>
		<Route path="deliberations/rules" element={<DeliberationRules />} />
		<Route
			path="deliberations/:deliberationId/*"
			element={<DeliberationLegacyRedirect />}
		/>
		<Route path="promotion/:id" element={<TransitionDetail />} />
		<Route path="graduation" element={<GraduatedStudents />} />
	</>
);
