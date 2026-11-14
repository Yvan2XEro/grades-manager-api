import { Route } from "react-router";
import GuardianPortal from "./pages/guardian-portal-page";

/** Public guardian portal (token-based access, no session). */
export const guardiansPublicRoutes = (
	<Route path="/guardian/portal" element={<GuardianPortal />} />
);
