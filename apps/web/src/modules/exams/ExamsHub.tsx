import { useTranslation } from "react-i18next";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "list", labelKey: "examsHub.tabs.exams" },
	{ path: "types", labelKey: "examsHub.tabs.types" },
	{ path: "scheduler", labelKey: "examsHub.tabs.scheduler" },
	{ path: "participation", labelKey: "examsHub.tabs.participation" },
	{ path: "export", labelKey: "examsHub.tabs.gradeExport" },
	{ path: "access", labelKey: "examsHub.tabs.gradeAccess" },
	{ path: "retakes", labelKey: "examsHub.tabs.retakes" },
	{ path: "templates", labelKey: "examsHub.tabs.gradeTemplates" },
	{ path: "class-documents", labelKey: "examsHub.tabs.classDocuments" },
] as const;

export default function ExamsHub() {
	const { t } = useTranslation();
	return (
		<div className="space-y-6">
			<PageHeader
				title={t("examsHub.title")}
				description={t("examsHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/admin/exams" />
		</div>
	);
}
