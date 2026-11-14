import { Route } from "react-router";
import NotificationsCenter from "./pages/notifications-center-page";
import NotificationsPage from "./pages/notifications-page";

export const notificationsRoutes = (
	<>
		<Route path="notifications" element={<NotificationsPage />} />
		<Route path="notifications/center" element={<NotificationsCenter />} />
	</>
);
