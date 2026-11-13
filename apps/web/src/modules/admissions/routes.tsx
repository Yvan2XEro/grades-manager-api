import { Route } from "react-router";
import AdmissionDetail from "./AdmissionDetail";
import AdmissionsManagement from "./AdmissionsManagement";
import ApplicationForm from "./ApplicationForm";
import ApplicationStatus from "./ApplicationStatus";

/** Public application pages (no session required). */
export const admissionsPublicRoutes = (
	<>
		<Route path="/admissions/apply" element={<ApplicationForm />} />
		<Route path="/admissions/status" element={<ApplicationStatus />} />
	</>
);

export const admissionsRoutes = (
	<>
		<Route path="admissions" element={<AdmissionsManagement />} />
		<Route path="admissions/:id" element={<AdmissionDetail />} />
	</>
);
