import { BookOpen, CheckCircle, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { PromotionExecutionItem } from "../types";

interface PromotionOverviewStatsProps {
	rules: { isActive: boolean }[] | undefined;
	executions: PromotionExecutionItem[] | undefined;
}

/** Active rules, recent executions and promoted students. */
export function PromotionOverviewStats({
	rules,
	executions,
}: PromotionOverviewStatsProps) {
	const { t } = useTranslation();
	const activeRules = rules?.filter((r) => r.isActive).length || 0;
	const totalExecutions = executions?.length || 0;
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="font-medium text-sm">
						{t("admin.promotionRules.dashboard.stats.activeRules")}
					</CardTitle>
					<BookOpen className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-3xl">{activeRules}</div>
					<p className="mt-1 text-muted-foreground text-xs">
						{t("admin.promotionRules.dashboard.stats.totalRules", {
							count: rules?.length || 0,
						})}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="font-medium text-sm">
						{t("admin.promotionRules.dashboard.stats.recentExecutions")}
					</CardTitle>
					<History className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-3xl">{totalExecutions}</div>
					<p className="mt-1 text-muted-foreground text-xs">
						{t("admin.promotionRules.dashboard.stats.last30Days")}
					</p>
				</CardContent>
			</Card>

			<Card className="border-primary/30 bg-primary/5">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="font-medium text-sm">
						{t("admin.promotionRules.dashboard.stats.studentsPromoted")}
					</CardTitle>
					<CheckCircle className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-3xl text-primary">
						{executions?.reduce((sum, ex) => sum + ex.studentsPromoted, 0) || 0}
					</div>
					<p className="mt-1 text-muted-foreground text-xs">
						{t("admin.promotionRules.dashboard.stats.acrossExecutions")}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
