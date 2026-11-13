import { useTranslation } from "react-i18next";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "classes", labelKey: "classesHub.tabs.classes" },
	{ path: "assignments", labelKey: "classesHub.tabs.assignments" },
	{ path: "enrollments", labelKey: "classesHub.tabs.enrollments" },
] as const;

export default function ClassesHub() {
	const { t } = useTranslation();
	return (
		<div className="space-y-6">
			<PageHeader
				title={t("classesHub.title")}
				description={t("classesHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/admin/classes" />
		</div>
	);
}
