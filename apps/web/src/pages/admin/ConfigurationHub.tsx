import { useTranslation } from "react-i18next";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "reg-numbers", labelKey: "configurationHub.tabs.regNumbers" },
	{ path: "grade-scale", labelKey: "configurationHub.tabs.gradeScale" },
	{ path: "templates", labelKey: "configurationHub.tabs.templates" },
	{ path: "rules", labelKey: "configurationHub.tabs.rules" },
] as const;

export default function ConfigurationHub() {
	const { t } = useTranslation();
	return (
		<div className="space-y-6">
			<PageHeader
				title={t("configurationHub.title")}
				description={t("configurationHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/admin/configuration" />
		</div>
	);
}
