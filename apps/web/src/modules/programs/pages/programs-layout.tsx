import { useTranslation } from "react-i18next";
import { HubLayout } from "@/components/layouts/ListLayout";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "programs", labelKey: "programsHub.tabs.programs" },
	{ path: "teaching-units", labelKey: "programsHub.tabs.teachingUnits" },
	{ path: "courses", labelKey: "programsHub.tabs.courses" },
] as const;

export default function ProgramsLayout() {
	const { t } = useTranslation();
	return (
		<HubLayout>
			<PageHeader
				title={t("programsHub.title")}
				description={t("programsHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/programs" />
		</HubLayout>
	);
}
