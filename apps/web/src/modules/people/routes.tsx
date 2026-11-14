import { Navigate, Route } from "react-router";
import ApiKeysManagement from "@/modules/api-keys/pages/api-keys-page";
import GuardianDirectory from "@/modules/guardians/GuardianDirectory";
import AcademicTimeline from "./pages/academic-timeline-page";
import PeopleManagement from "./pages/people-page";
import ProfileAccessTab from "./pages/profile-detail/profile-detail-access";
import ProfileEnrollmentsTab from "./pages/profile-detail/profile-detail-enrollments";
import ProfileFinancesTab from "./pages/profile-detail/profile-detail-finances";
import ProfileGuardiansTab from "./pages/profile-detail/profile-detail-guardians";
import ProfileIdentityTab from "./pages/profile-detail/profile-detail-identity";
import ProfileHub from "./pages/profile-detail/profile-detail-layout";
import ProfileResultsTab from "./pages/profile-detail/profile-detail-results";
import UsersHub from "./pages/users-layout";

export const peopleRoutes = (
	<>
		<Route path="users" element={<UsersHub />}>
			<Route index element={<Navigate to="people" replace />} />
			<Route path="people" element={<PeopleManagement />} />
			<Route path="guardians" element={<GuardianDirectory />} />
			<Route path="api-keys" element={<ApiKeysManagement />} />
			<Route
				path="accounts"
				element={<Navigate to="/users/people" replace />}
			/>
			<Route
				path="students"
				element={<Navigate to="/users/people" replace />}
			/>
		</Route>
		<Route path="profiles/:profileId" element={<ProfileHub />}>
			<Route index element={<Navigate to="identity" replace />} />
			<Route path="identity" element={<ProfileIdentityTab />} />
			<Route path="enrollments" element={<ProfileEnrollmentsTab />} />
			<Route path="results" element={<ProfileResultsTab />} />
			<Route path="finances" element={<ProfileFinancesTab />} />
			<Route path="guardians" element={<ProfileGuardiansTab />} />
			<Route path="access" element={<ProfileAccessTab />} />
		</Route>
		<Route path="timeline" element={<AcademicTimeline />} />
	</>
);
