import { useTranslation } from "react-i18next";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "export", labelKey: "gradesHub.tabs.export" },
	{ path: "access", labelKey: "gradesHub.tabs.access" },
	{ path: "retake", labelKey: "gradesHub.tabs.retake" },
	{ path: "templates", labelKey: "gradesHub.tabs.templates" },
	{ path: "class-documents", labelKey: "gradesHub.tabs.classDocuments" },
] as const;

export default function GradesHub() {
	const { t } = useTranslation();
	return (
		<div className="space-y-6">
			<PageHeader
				title={t("gradesHub.title")}
				description={t("gradesHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/admin/grades" />
		</div>
	);
}
