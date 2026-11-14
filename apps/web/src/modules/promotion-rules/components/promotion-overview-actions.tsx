import { ArrowRight, BookOpen, History, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

/** Links to the rules, evaluate and history tabs. */
export function PromotionOverviewActions() {
	const { t } = useTranslation();
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			<Card className="group border-primary/20 transition-all duration-200 hover:border-primary/40 hover:shadow-lg">
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<BookOpen className="h-5 w-5" />
								{t("admin.promotionRules.dashboard.actions.manageRules")}
							</CardTitle>
							<CardDescription className="mt-2">
								{t("admin.promotionRules.dashboard.actions.manageRulesDesc")}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Link to="/promotion-legacy?tab=rules">
						<Button className="w-full group-hover:bg-primary/90">
							{t("admin.promotionRules.dashboard.actions.viewRules")}
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</CardContent>
			</Card>

			<Card className="group border-green-500/20 transition-all duration-200 hover:border-green-500/40 hover:shadow-lg">
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Play className="h-5 w-5" />
								{t("admin.promotionRules.dashboard.actions.evaluateExecute")}
							</CardTitle>
							<CardDescription className="mt-2">
								{t(
									"admin.promotionRules.dashboard.actions.evaluateExecuteDesc",
								)}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Link to="/promotion-legacy?tab=evaluate">
						<Button className="w-full bg-green-600 hover:bg-green-700">
							{t("admin.promotionRules.dashboard.actions.startEvaluation")}
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</CardContent>
			</Card>

			<Card className="group border-blue-500/20 transition-all duration-200 hover:border-blue-500/40 hover:shadow-lg md:col-span-2">
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<History className="h-5 w-5" />
								{t("admin.promotionRules.dashboard.actions.executionHistory")}
							</CardTitle>
							<CardDescription className="mt-2">
								{t(
									"admin.promotionRules.dashboard.actions.executionHistoryDesc",
								)}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Link to="/promotion-legacy?tab=history">
						<Button variant="outline" className="w-full group-hover:bg-blue-50">
							{t("admin.promotionRules.dashboard.actions.viewHistory")}
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
