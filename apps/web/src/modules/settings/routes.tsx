import { Navigate, Route } from "react-router";
import AccountTab from "./pages/settings-account";
import AccountSettings from "./pages/settings-layout";
import PreferencesTab from "./pages/settings-preferences";
import ProfileTab from "./pages/settings-profile";

export const settingsRoutes = (
	<Route path="settings" element={<AccountSettings />}>
		<Route index element={<Navigate to="account" replace />} />
		<Route path="account" element={<AccountTab />} />
		<Route path="profile" element={<ProfileTab />} />
		<Route path="preferences" element={<PreferencesTab />} />
	</Route>
);
