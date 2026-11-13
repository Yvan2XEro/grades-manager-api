import { Navigate, Route } from "react-router";
import CenterManagement from "./CenterManagement";
import {
	CenterAuthorizationTab,
	CenterContactTab,
	CenterDetail,
	CenterIdentityTab,
	CenterInstancesTab,
	CenterLogosTab,
} from "./index";

export const centersRoutes = (
	<>
		<Route path="centers" element={<CenterManagement />} />
		<Route path="centers/new" element={<CenterDetail />} />
		<Route path="centers/:centerId" element={<CenterDetail />}>
			<Route index element={<Navigate to="identity" replace />} />
			<Route path="identity" element={<CenterIdentityTab />} />
			<Route path="logos" element={<CenterLogosTab />} />
			<Route path="instances" element={<CenterInstancesTab />} />
			<Route path="authorization" element={<CenterAuthorizationTab />} />
			<Route path="contact" element={<CenterContactTab />} />
		</Route>
	</>
);
