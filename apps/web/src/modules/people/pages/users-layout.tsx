import { HubLayout } from "@/components/layouts/ListLayout";
import { HubNav } from "@/components/navigation/HubNav";

const tabs = [
	{ path: "people", labelKey: "usersHub.tabs.people" },
	{ path: "guardians", labelKey: "usersHub.tabs.guardians" },
	{ path: "api-keys", labelKey: "usersHub.tabs.apiKeys" },
] as const;

export default function UsersHub() {
	return (
		<HubLayout>
			<HubNav tabs={tabs} basePath="/users" />
		</HubLayout>
	);
}
