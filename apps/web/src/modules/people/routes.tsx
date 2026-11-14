import { Navigate, Route } from "react-router";
import ApiKeysManagement from "@/modules/api-keys/ApiKeysManagement";
import GuardianDirectory from "@/modules/guardians/pages/guardian-directory-page";
import AcademicTimeline from "./AcademicTimeline";
import {
	ProfileAccessTab,
	ProfileEnrollmentsTab,
	ProfileFinancesTab,
	ProfileGuardiansTab,
	ProfileHub,
	ProfileIdentityTab,
	ProfileResultsTab,
} from "./index";
import PeopleManagement from "./PeopleManagement";
import UsersHub from "./UsersHub";

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
