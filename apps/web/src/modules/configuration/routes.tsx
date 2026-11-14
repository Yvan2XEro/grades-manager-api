import { Navigate, Route } from "react-router";
import ExportTemplatesManagement from "@/modules/documents/pages/export-templates-page";
import ConfigurationLayout from "./pages/configuration-layout";
import GradeScalePage from "./pages/grade-scale-page";
import RegistrationFormatDetailPage from "./pages/registration-format-detail-page";
import RegistrationFormatsPage from "./pages/registration-formats-page";
import RulesRedirectPage from "./pages/rules-redirect-page";

export const configurationRoutes = (
	<>
		<Route path="configuration" element={<ConfigurationLayout />}>
			<Route index element={<Navigate to="reg-numbers" replace />} />
			<Route path="reg-numbers" element={<RegistrationFormatsPage />} />
			<Route path="grade-scale" element={<GradeScalePage />} />
			<Route path="templates" element={<ExportTemplatesManagement />} />
			<Route path="rules" element={<RulesRedirectPage />} />
		</Route>
		<Route
			path="registration-numbers/:formatId"
			element={<RegistrationFormatDetailPage />}
		/>
	</>
);
