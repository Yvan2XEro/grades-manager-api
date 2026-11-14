import { Route } from "react-router";
import AdmissionDetail from "./AdmissionDetail";
import AdmissionsManagement from "./AdmissionsManagement";
import ApplicationFormPage from "./pages/application-form-page";
import ApplicationStatusPage from "./pages/application-status-page";

/** Public application pages (no session required). */
export const admissionsPublicRoutes = (
	<>
		<Route path="/admissions/apply" element={<ApplicationFormPage />} />
		<Route path="/admissions/status" element={<ApplicationStatusPage />} />
	</>
);

export const admissionsRoutes = (
	<>
		<Route path="admissions" element={<AdmissionsManagement />} />
		<Route path="admissions/:id" element={<AdmissionDetail />} />
	</>
);
