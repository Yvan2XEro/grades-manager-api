import { useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExamManagement from "./ExamManagement";
import ExamParticipationRoster from "./ExamParticipationRoster";
import ExamScheduler from "./ExamScheduler";
import ExamTypes from "./ExamTypes";

export default function ExamsHub() {
	const { t } = useTranslation();
	const [tab, setTab] = useQueryState("tab", { defaultValue: "exams" });

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("examsHub.title")}
				description={t("examsHub.description")}
			/>
			<Tabs value={tab ?? "exams"} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="exams">{t("examsHub.tabs.exams")}</TabsTrigger>
					<TabsTrigger value="types">{t("examsHub.tabs.types")}</TabsTrigger>
					<TabsTrigger value="scheduler">
						{t("examsHub.tabs.scheduler")}
					</TabsTrigger>
					<TabsTrigger value="participation">
						{t("examsHub.tabs.participation")}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="exams" className="mt-4">
					<ExamManagement />
				</TabsContent>
				<TabsContent value="types" className="mt-4">
					<ExamTypes />
				</TabsContent>
				<TabsContent value="scheduler" className="mt-4">
					<ExamScheduler />
				</TabsContent>
				<TabsContent value="participation" className="mt-4">
					<ExamParticipationRoster />
				</TabsContent>
			</Tabs>
		</div>
	);
}
