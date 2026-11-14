import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";

import { PromotionOverviewActions } from "../../components/promotion-overview-actions";
import { PromotionOverviewStats } from "../../components/promotion-overview-stats";
import { PromotionRecentActivity } from "../../components/promotion-recent-activity";
import { useRecentPromotionExecutions } from "../../hooks/use-promotion-executions";
import { usePromotionRules } from "../../hooks/use-promotion-rules";

export function PromotionRulesDashboard() {
	const { t } = useTranslation();
	const {
		data: rulesData,
		isLoading: rulesLoading,
		isError: rulesError,
		error: rulesErrorObj,
	} = usePromotionRules();
	const { data: executionsData, isLoading: executionsLoading } =
		useRecentPromotionExecutions();

	useEffect(() => {
		if (rulesError && rulesErrorObj instanceof Error) {
			toast.error(rulesErrorObj.message);
		}
	}, [rulesError, rulesErrorObj]);

	const isLoading = rulesLoading || executionsLoading;

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-foreground">
					{t("admin.promotionRules.dashboard.title")}
				</h1>
				<p className="mt-2 text-lg text-muted-foreground">
					{t("admin.promotionRules.dashboard.subtitle")}
				</p>
			</div>

			{isLoading && (
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Loader2 className="h-4 w-4 animate-spin" />
					{t("common.loading", { defaultValue: "Loading..." })}
				</div>
			)}

			{/* Quick Stats */}
			<PromotionOverviewStats
				rules={rulesData?.items}
				executions={executionsData?.items}
			/>

			<PromotionOverviewActions />

			{executionsData && executionsData.items.length > 0 && (
				<PromotionRecentActivity executions={executionsData.items} />
			)}
		</div>
	);
}
