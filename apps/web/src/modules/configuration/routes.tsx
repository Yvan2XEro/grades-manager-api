import { Navigate, Route } from "react-router";
import ExportTemplatesManagement from "@/modules/documents/pages/export-templates-page";
import ConfigurationHub from "./ConfigurationHub";
import GradeScaleSettings from "./GradeScaleSettings";
import RegistrationNumberFormatDetail from "./RegistrationNumberFormatDetail";
import RegistrationNumberFormats from "./RegistrationNumberFormats";
import RuleManagement from "./RuleManagement";

export const configurationRoutes = (
	<>
		<Route path="configuration" element={<ConfigurationHub />}>
			<Route index element={<Navigate to="reg-numbers" replace />} />
			<Route path="reg-numbers" element={<RegistrationNumberFormats />} />
			<Route path="grade-scale" element={<GradeScaleSettings />} />
			<Route path="templates" element={<ExportTemplatesManagement />} />
			<Route path="rules" element={<RuleManagement />} />
		</Route>
		<Route
			path="registration-numbers/:formatId"
			element={<RegistrationNumberFormatDetail />}
		/>
	</>
);
