import { Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HubNav } from "@/components/navigation/HubNav";

const tabs = [
	{ path: "account", labelKey: "settings.tabs.account" },
	{ path: "profile", labelKey: "settings.tabs.profile" },
	{ path: "preferences", labelKey: "settings.tabs.preferences" },
] as const;

export default function AccountSettings() {
	const { t } = useTranslation();
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<SettingsIcon className="h-5 w-5" />
					</div>
					<div>
						<h1 className="font-semibold text-2xl">{t("settings.title")}</h1>
						<p className="text-muted-foreground">{t("settings.subtitle")}</p>
					</div>
				</div>
			</div>
			<HubNav tabs={tabs} basePath="/settings" />
		</div>
	);
}
