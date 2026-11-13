import { useTranslation } from "react-i18next";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "schedule", labelKey: "timetableHub.tabs.timetable" },
	{ path: "rooms", labelKey: "timetableHub.tabs.rooms" },
	{ path: "attendance", labelKey: "timetableHub.tabs.attendance" },
	{ path: "rates", labelKey: "timetableHub.tabs.rates" },
	{ path: "overview", labelKey: "timetableHub.tabs.overview" },
] as const;

export default function TimetableHub() {
	const { t } = useTranslation();
	return (
		<div className="space-y-6">
			<PageHeader
				title={t("timetableHub.title")}
				description={t("timetableHub.description")}
			/>
			<HubNav tabs={tabs} basePath="/admin/timetable" />
		</div>
	);
}
