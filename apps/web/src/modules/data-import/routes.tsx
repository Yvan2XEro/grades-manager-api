import { Route } from "react-router";
import DataImportHub from "./pages/data-import-page";

export const dataImportRoutes = (
	<Route path="import" element={<DataImportHub />} />
);
