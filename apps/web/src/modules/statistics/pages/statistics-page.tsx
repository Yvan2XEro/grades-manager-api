import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { PageHeader } from "@/components/ui/page-header";
import { StatisticsAdmissionsTab } from "../components/statistics-admissions-tab";
import { StatisticsFinancesTab } from "../components/statistics-finances-tab";
import { StatisticsPerformanceTab } from "../components/statistics-performance-tab";
import { StatisticsStudentsTab } from "../components/statistics-students-tab";
import { StatisticsTabBar } from "../components/statistics-tab-bar";
import { useStatisticsYear } from "../hooks/use-statistics";
import type { StatisticsTab } from "../types";

export default function StatisticsHub() {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<StatisticsTab>("students");
	const [yearId, setYearId] = useStatisticsYear();

	return (
		<div className="space-y-5">
			<PageHeader
				title={t("admin.statistics.title")}
				description={t("admin.statistics.description")}
				actions={
					<div className="w-52">
						<AcademicYearSelect
							value={yearId}
							onChange={setYearId}
							allowAll
							allLabel={t("common.allYears")}
							autoSelectActive={false}
						/>
					</div>
				}
			/>

			<StatisticsTabBar activeTab={activeTab} onChange={setActiveTab} />

			{activeTab === "students" && <StatisticsStudentsTab yearId={yearId} />}
			{activeTab === "performance" && (
				<StatisticsPerformanceTab yearId={yearId} />
			)}
			{activeTab === "finances" && <StatisticsFinancesTab yearId={yearId} />}
			{activeTab === "admissions" && (
				<StatisticsAdmissionsTab yearId={yearId} />
			)}
		</div>
	);
}
