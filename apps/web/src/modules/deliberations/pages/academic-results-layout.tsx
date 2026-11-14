import { useTranslation } from "react-i18next";
import { HubLayout } from "@/components/layouts/ListLayout";
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
		<HubLayout>
			<PageHeader
				title={t("academicResultsHub.title")}
				description={t("academicResultsHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/academic-results" />
		</HubLayout>
	);
}
