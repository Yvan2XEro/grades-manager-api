import { useTranslation } from "react-i18next";
import { HubLayout } from "@/components/layouts/ListLayout";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "classes", labelKey: "classesHub.tabs.classes" },
	{ path: "assignments", labelKey: "classesHub.tabs.assignments" },
	{ path: "enrollments", labelKey: "classesHub.tabs.enrollments" },
] as const;

export default function ClassesLayout() {
	const { t } = useTranslation();
	return (
		<HubLayout>
			<PageHeader
				title={t("classesHub.title")}
				description={t("classesHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/classes" />
		</HubLayout>
	);
}
