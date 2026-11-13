import { useTranslation } from "react-i18next";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "overview", labelKey: "institutionHub.tabs.overview" },
	{ path: "faculties", labelKey: "institutionHub.tabs.faculties" },
	{ path: "cycles", labelKey: "institutionHub.tabs.cycles" },
] as const;

export default function InstitutionHub() {
	const { t } = useTranslation();
	return (
		<div className="space-y-6">
			<PageHeader
				title={t("institutionHub.title")}
				description={t("institutionHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/admin/institution" />
		</div>
	);
}
