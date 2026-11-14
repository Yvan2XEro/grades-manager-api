import { Route } from "react-router";
import PromotionHub from "./pages/promotion-hub/promotion-hub-layout";

export const promotionRulesRoutes = (
	<Route path="promotion-legacy" element={<PromotionHub />} />
);
