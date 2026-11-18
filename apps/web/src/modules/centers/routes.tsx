import { Navigate, Route } from "react-router";
import CenterCreatePage from "./pages/center-create-page";
import CenterDetailAuthorization from "./pages/center-detail/center-detail-authorization";
import CenterDetailContact from "./pages/center-detail/center-detail-contact";
import CenterDetailIdentity from "./pages/center-detail/center-detail-identity";
import CenterDetailInstances from "./pages/center-detail/center-detail-instances";
import CenterDetailLayout from "./pages/center-detail/center-detail-layout";
import CenterDetailLogos from "./pages/center-detail/center-detail-logos";
import CentersPage from "./pages/centers-page";

/** The centres list, rendered as the "centers" tab of the institution hub. */
export const centersTabRoute = (
	<Route path="centers" element={<CentersPage />} />
);

/** Centre creation and detail pages, under `/institution`. */
export const centersDetailRoutes = (
	<>
		<Route path="centers/new" element={<CenterCreatePage />} />
		<Route path="centers/:centerId" element={<CenterDetailLayout />}>
			<Route index element={<Navigate to="identity" replace />} />
			<Route path="identity" element={<CenterDetailIdentity />} />
			<Route path="logos" element={<CenterDetailLogos />} />
			<Route path="instances" element={<CenterDetailInstances />} />
			<Route path="authorization" element={<CenterDetailAuthorization />} />
			<Route path="contact" element={<CenterDetailContact />} />
		</Route>
	</>
);
