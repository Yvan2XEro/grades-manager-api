import { Route } from "react-router";
import NotificationsCenter from "./NotificationsCenter";
import NotificationsPage from "./NotificationsPage";

export const notificationsRoutes = (
	<>
		<Route path="notifications" element={<NotificationsPage />} />
		<Route path="notifications/center" element={<NotificationsCenter />} />
	</>
);
