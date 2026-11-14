import { Route } from "react-router";
import MonitoringDashboard from "./pages/monitoring-page";

export const monitoringRoutes = (
	<Route path="monitoring" element={<MonitoringDashboard />} />
);
