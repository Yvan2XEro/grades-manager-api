import { useTranslation } from "react-i18next";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{
		path: "deliberations",
		labelKey: "academicResultsHub.tabs.deliberations",
	},
	{ path: "promotion", labelKey: "academicResultsHub.tabs.promotion" },
] as const;

export default function AcademicResultsHub() {
	const { t } = useTranslation();
	return (
		<div className="space-y-6">
			<PageHeader
				title={t("academicResultsHub.title")}
				description={t("academicResultsHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/admin/academic-results" />
		</div>
	);
}
