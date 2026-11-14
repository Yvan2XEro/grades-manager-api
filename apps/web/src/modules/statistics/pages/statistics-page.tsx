import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { StatisticsAdmissionsTab } from "./StatisticsAdmissionsTab";
import { StatisticsFinancesTab } from "./StatisticsFinancesTab";
import { StatisticsPerformanceTab } from "./StatisticsPerformanceTab";
import { StatisticsStudentsTab } from "./StatisticsStudentsTab";

type TabKey = "students" | "performance" | "finances" | "admissions";
const TABS: TabKey[] = ["students", "performance", "finances", "admissions"];

export default function StatisticsHub() {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<TabKey>("students");
	const [yearId, setYearId] = useState<string | null>(null);
	const [yearInitialized, setYearInitialized] = useState(false);

	const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	useEffect(() => {
		const active = yearListQuery.data?.items.find((y) => y.isActive)?.id;
		if (!yearInitialized && active) {
			setYearId(active);
			setYearInitialized(true);
		}
	}, [yearListQuery.data, yearInitialized]);

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

			{/* Tab bar */}
			<div className="flex items-center gap-1 border-b">
				{TABS.map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setActiveTab(tab)}
						className={cn(
							"relative px-4 py-2.5 font-medium text-sm transition-colors",
							activeTab === tab
								? "text-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{t(`admin.statistics.tabs.${tab}`)}
					</button>
				))}
			</div>

			{/* Tab content */}
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
