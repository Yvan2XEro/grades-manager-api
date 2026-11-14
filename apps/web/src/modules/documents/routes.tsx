import { Route } from "react-router";
import BulkDocumentGeneration from "./BulkDocumentGeneration";
import DocumentsPage from "./pages/documents-page";
import ExportTemplateEditor from "./pages/export-template-editor-page";

export const documentsRoutes = (
	<>
		<Route path="documents" element={<DocumentsPage />} />
		<Route path="document-batch" element={<BulkDocumentGeneration />} />
		<Route
			path="export-templates/:templateId"
			element={<ExportTemplateEditor />}
		/>
	</>
);
