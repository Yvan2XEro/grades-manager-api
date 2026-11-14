import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { StatisticsTab } from "../types";

const TABS: StatisticsTab[] = [
	"students",
	"performance",
	"finances",
	"admissions",
];

export function StatisticsTabBar({
	activeTab,
	onChange,
}: {
	activeTab: StatisticsTab;
	onChange: (tab: StatisticsTab) => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center gap-1 border-b">
			{TABS.map((tab) => (
				<button
					key={tab}
					type="button"
					onClick={() => onChange(tab)}
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
	);
}
