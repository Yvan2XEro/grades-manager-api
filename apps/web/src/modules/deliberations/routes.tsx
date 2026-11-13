import { Navigate, Route } from "react-router";
import AcademicResultsHub from "./AcademicResultsHub";
import AcademicYearTransitions from "./AcademicYearTransitions";
import GraduatedStudents from "./GraduatedStudents";
import {
	DeliberationActivityTab,
	DeliberationDetail,
	DeliberationJuryTab,
	DeliberationLegacyRedirect,
	DeliberationResultsTab,
	DeliberationRules,
	DeliberationsList,
} from "./index";
import TransitionDetail from "./TransitionDetail";

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
			path="deliberations/:deliberationId"
			element={<DeliberationLegacyRedirect />}
		/>
		<Route path="promotion/:id" element={<TransitionDetail />} />
		<Route path="graduation" element={<GraduatedStudents />} />
	</>
);
