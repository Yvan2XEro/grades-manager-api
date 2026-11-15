import { Navigate, Route } from "react-router";
import DataImportPage from "./pages/data-import-page";
import ImportStepPage from "./pages/import-step-page";
import YearImportPage from "./pages/year-import-page";

export const dataImportRoutes = (
	<>
		<Route path="import" element={<DataImportPage />} />
		{/* Former single-file importers, replaced by the guided import */}
		<Route path="import/legacy" element={<Navigate to="/import" replace />} />
		<Route path="import/years/:yearId" element={<YearImportPage />} />
		<Route path="import/:step" element={<ImportStepPage />} />
	</>
);
