import { Route } from "react-router";
import BulkDocumentGeneration from "./BulkDocumentGeneration";
import DocumentsPage from "./DocumentsPage";
import ExportTemplateEditor from "./ExportTemplateEditor";

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
