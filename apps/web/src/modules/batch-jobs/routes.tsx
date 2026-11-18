import { Route } from "react-router";
import BatchJobDetailPage from "./pages/batch-job-detail-page";
import BatchJobsPage from "./pages/batch-jobs-page";

export const batchJobsRoutes = (
	<>
		<Route path="batch-jobs" element={<BatchJobsPage />} />
		<Route path="batch-jobs/:jobId" element={<BatchJobDetailPage />} />
	</>
);
