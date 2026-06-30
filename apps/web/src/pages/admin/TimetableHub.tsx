import { useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceManagement from "./attendance/AttendanceManagement";
import AttendanceRates from "./attendance/AttendanceRates";
import RoomsManagement from "./RoomsManagement";
import TimetableManagement from "./TimetableManagement";

export default function TimetableHub() {
	const { t } = useTranslation();
	const [tab, setTab] = useQueryState("tab", { defaultValue: "timetable" });

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("timetableHub.title")}
				description={t("timetableHub.description")}
			/>
			<Tabs value={tab ?? "timetable"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="timetable">
						{t("timetableHub.tabs.timetable")}
					</TabsTrigger>
					<TabsTrigger value="rooms">
						{t("timetableHub.tabs.rooms")}
					</TabsTrigger>
					<TabsTrigger value="attendance">
						{t("timetableHub.tabs.attendance")}
					</TabsTrigger>
					<TabsTrigger value="rates">
						{t("timetableHub.tabs.rates")}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="timetable" className="mt-4">
					<TimetableManagement />
				</TabsContent>
				<TabsContent value="rooms" className="mt-4">
					<RoomsManagement />
				</TabsContent>
				<TabsContent value="attendance" className="mt-4">
					<AttendanceManagement />
				</TabsContent>
				<TabsContent value="rates" className="mt-4">
					<AttendanceRates />
				</TabsContent>
			</Tabs>
		</div>
	);
}
