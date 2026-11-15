import { Route } from "react-router";
import DataImportPage from "./pages/data-import-page";
import ImportStepPage from "./pages/import-step-page";
import LegacyImportPage from "./pages/legacy-import-page";
import YearImportPage from "./pages/year-import-page";

export const dataImportRoutes = (
	<>
		<Route path="import" element={<DataImportPage />} />
		<Route path="import/legacy" element={<LegacyImportPage />} />
		<Route path="import/years/:yearId" element={<YearImportPage />} />
		<Route path="import/:step" element={<ImportStepPage />} />
	</>
);
