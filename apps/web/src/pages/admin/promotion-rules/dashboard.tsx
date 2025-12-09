import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { ArrowRight, BookOpen, CheckCircle, History, Play } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

export function PromotionRulesDashboard() {
	const { t } = useTranslation();

	const { data: rulesData } = useQuery({
		queryKey: ["promotionRules"],
		queryFn: async () => trpcClient.promotionRules.list.query({}),
	});

	const { data: executionsData } = useQuery({
		queryKey: ["promotionExecutions", { limit: 5 }],
		queryFn: async () => trpcClient.promotionRules.listExecutions.query({ limit: 5 }),
	});

	const activeRules = rulesData?.items.filter((r) => r.isActive).length || 0;
	const totalExecutions = executionsData?.items.length || 0;

	return (
		<div className="container mx-auto py-8 space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-4xl font-bold tracking-tight">{t("admin.promotionRules.dashboard.title")}</h1>
				<p className="text-muted-foreground mt-2 text-lg">
					{t("admin.promotionRules.dashboard.subtitle")}
				</p>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">{t("admin.promotionRules.dashboard.stats.activeRules")}</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{activeRules}</div>
						<p className="text-xs text-muted-foreground mt-1">
							{t("admin.promotionRules.dashboard.stats.totalRules", { count: rulesData?.items.length || 0 })}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">{t("admin.promotionRules.dashboard.stats.recentExecutions")}</CardTitle>
						<History className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{totalExecutions}</div>
						<p className="text-xs text-muted-foreground mt-1">
							{t("admin.promotionRules.dashboard.stats.last30Days")}
						</p>
					</CardContent>
				</Card>

				<Card className="border-primary/30 bg-primary/5">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">{t("admin.promotionRules.dashboard.stats.studentsPromoted")}</CardTitle>
						<CheckCircle className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-primary">
							{executionsData?.items.reduce((sum, ex) => sum + ex.studentsPromoted, 0) || 0}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{t("admin.promotionRules.dashboard.stats.acrossExecutions")}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Action Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card className="group hover:shadow-lg transition-all duration-200 border-primary/20 hover:border-primary/40">
					<CardHeader>
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<BookOpen className="w-5 h-5" />
									{t("admin.promotionRules.dashboard.actions.manageRules")}
								</CardTitle>
								<CardDescription className="mt-2">
									{t("admin.promotionRules.dashboard.actions.manageRulesDesc")}
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Link to="/admin/promotion-rules/rules">
							<Button className="w-full group-hover:bg-primary/90">
								{t("admin.promotionRules.dashboard.actions.viewRules")}
								<ArrowRight className="w-4 h-4 ml-2" />
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="group hover:shadow-lg transition-all duration-200 border-green-500/20 hover:border-green-500/40">
					<CardHeader>
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Play className="w-5 h-5" />
									{t("admin.promotionRules.dashboard.actions.evaluateExecute")}
								</CardTitle>
								<CardDescription className="mt-2">
									{t("admin.promotionRules.dashboard.actions.evaluateExecuteDesc")}
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Link to="/admin/promotion-rules/evaluate">
							<Button className="w-full bg-green-600 hover:bg-green-700">
								{t("admin.promotionRules.dashboard.actions.startEvaluation")}
								<ArrowRight className="w-4 h-4 ml-2" />
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="group hover:shadow-lg transition-all duration-200 border-blue-500/20 hover:border-blue-500/40 md:col-span-2">
					<CardHeader>
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<History className="w-5 h-5" />
									{t("admin.promotionRules.dashboard.actions.executionHistory")}
								</CardTitle>
								<CardDescription className="mt-2">
									{t("admin.promotionRules.dashboard.actions.executionHistoryDesc")}
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Link to="/admin/promotion-rules/history">
							<Button variant="outline" className="w-full group-hover:bg-blue-50">
								{t("admin.promotionRules.dashboard.actions.viewHistory")}
								<ArrowRight className="w-4 h-4 ml-2" />
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			{executionsData && executionsData.items.length > 0 && (
				<div>
					<h2 className="text-2xl font-bold mb-4">{t("admin.promotionRules.dashboard.recentActivity.title")}</h2>
					<Card>
						<CardContent className="pt-6">
							<div className="space-y-4">
								{executionsData.items.slice(0, 5).map((execution) => (
									<div
										key={execution.id}
										className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-center gap-4">
											<div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
												<CheckCircle className="h-5 w-5 text-green-600" />
											</div>
											<div>
												<div className="font-medium">
													{t("admin.promotionRules.dashboard.recentActivity.studentsPromoted", { count: execution.studentsPromoted })}
												</div>
												<div className="text-sm text-muted-foreground">
													{new Date(execution.executedAt).toLocaleDateString()} •{" "}
													{(execution as any).metadata?.ruleName || t("admin.promotionRules.dashboard.recentActivity.unknownRule")}
												</div>
											</div>
										</div>
										<Link to="/admin/promotion-rules/history">
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
			)}
		</div>
	);
}
