import { Route } from "react-router";
import BatchJobDetail from "./BatchJobDetail";
import BatchJobsDashboard from "./BatchJobsDashboard";

export const batchJobsRoutes = (
	<>
		<Route path="batch-jobs" element={<BatchJobsDashboard />} />
		<Route path="batch-jobs/:jobId" element={<BatchJobDetail />} />
	</>
);
