import { Route } from "react-router";
import GuardianPortal from "./GuardianPortal";

/** Public guardian portal (token-based access, no session). */
export const guardiansPublicRoutes = (
	<Route path="/guardian/portal" element={<GuardianPortal />} />
);
