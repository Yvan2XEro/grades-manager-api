import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { PromotionExecutionItem } from "../types";

/** Latest executions with a link to the history tab. */
export function PromotionRecentActivity({
	executions,
}: {
	executions: PromotionExecutionItem[];
}) {
	const { t } = useTranslation();
	return (
		<div>
			<h2 className="mb-4 font-semibold text-foreground text-xl">
				{t("admin.promotionRules.dashboard.recentActivity.title")}
			</h2>
			<Card>
				<CardContent className="pt-6">
					<div className="space-y-4">
						{executions.slice(0, 5).map((execution) => (
							<div
								key={execution.id}
								className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
							>
								<div className="flex items-center gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
										<CheckCircle className="h-5 w-5 text-green-600" />
									</div>
									<div>
										<div className="font-medium">
											{t(
												"admin.promotionRules.dashboard.recentActivity.studentsPromoted",
												{
													count: execution.studentsPromoted,
												},
											)}
										</div>
										<div className="text-muted-foreground text-xs">
											{new Date(execution.executedAt).toLocaleDateString()} •{" "}
											{(execution as any).metadata?.ruleName ||
												t(
													"admin.promotionRules.dashboard.recentActivity.unknownRule",
												)}
										</div>
									</div>
								</div>
								<Link to="/promotion-legacy?tab=history">
									<Button variant="ghost" size="sm">
										{t("admin.promotionRules.dashboard.recentActivity.details")}
									</Button>
								</Link>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
