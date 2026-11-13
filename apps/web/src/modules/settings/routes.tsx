import { Navigate, Route } from "react-router";
import AccountSettings from "./AccountSettings";
import AccountTab from "./AccountTab";
import PreferencesTab from "./PreferencesTab";
import ProfileTab from "./ProfileTab";

export const settingsRoutes = (
	<Route path="settings" element={<AccountSettings />}>
		<Route index element={<Navigate to="account" replace />} />
		<Route path="account" element={<AccountTab />} />
		<Route path="profile" element={<ProfileTab />} />
		<Route path="preferences" element={<PreferencesTab />} />
	</Route>
);
