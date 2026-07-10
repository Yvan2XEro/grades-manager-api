import { useTranslation } from "react-i18next";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "accounts", labelKey: "usersHub.tabs.accounts" },
	{ path: "students", labelKey: "usersHub.tabs.students" },
	{ path: "guardians", labelKey: "usersHub.tabs.guardians" },
	{ path: "api-keys", labelKey: "usersHub.tabs.apiKeys" },
] as const;

export default function UsersHub() {
	const { t } = useTranslation();
	return (
		<div className="space-y-6">
			<PageHeader
				title={t("usersHub.title")}
				description={t("usersHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/admin/users" />
		</div>
	);
}
