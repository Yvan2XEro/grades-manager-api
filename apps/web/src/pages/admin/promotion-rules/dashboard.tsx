import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle, History, Play } from "lucide-react";
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
import { trpcClient } from "@/utils/trpc";

export function PromotionRulesDashboard() {
	const { t } = useTranslation();

	const { data: rulesData } = useQuery({
		queryKey: ["promotionRules"],
		queryFn: async () => trpcClient.promotionRules.list.query({}),
	});

	const { data: executionsData } = useQuery({
		queryKey: ["promotionExecutions", { limit: 5 }],
		queryFn: async () =>
			trpcClient.promotionRules.listExecutions.query({ limit: 5 }),
	});

	const activeRules = rulesData?.items.filter((r) => r.isActive).length || 0;
	const totalExecutions = executionsData?.items.length || 0;

	return (
		<div className="container mx-auto space-y-8 py-8">
			{/* Header */}
			<div>
				<h1 className="font-bold text-4xl tracking-tight">
					{t("admin.promotionRules.dashboard.title")}
				</h1>
				<p className="mt-2 text-lg text-muted-foreground">
					{t("admin.promotionRules.dashboard.subtitle")}
				</p>
			</div>

			{/* Quick Stats */}
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
								count: rulesData?.items.length || 0,
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
							{executionsData?.items.reduce(
								(sum, ex) => sum + ex.studentsPromoted,
								0,
							) || 0}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							{t("admin.promotionRules.dashboard.stats.acrossExecutions")}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Action Cards */}
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
						<Link to="/admin/promotion-rules/rules">
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
						<Link to="/admin/promotion-rules/evaluate">
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
						<Link to="/admin/promotion-rules/history">
							<Button
								variant="outline"
								className="w-full group-hover:bg-blue-50"
							>
								{t("admin.promotionRules.dashboard.actions.viewHistory")}
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			{executionsData && executionsData.items.length > 0 && (
				<div>
					<h2 className="mb-4 font-bold text-2xl">
						{t("admin.promotionRules.dashboard.recentActivity.title")}
					</h2>
					<Card>
						<CardContent className="pt-6">
							<div className="space-y-4">
								{executionsData.items.slice(0, 5).map((execution) => (
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
														{ count: execution.studentsPromoted },
													)}
												</div>
												<div className="text-muted-foreground text-sm">
													{new Date(execution.executedAt).toLocaleDateString()}{" "}
													•{" "}
													{(execution as any).metadata?.ruleName ||
														t(
															"admin.promotionRules.dashboard.recentActivity.unknownRule",
														)}
												</div>
											</div>
										</div>
										<Link to="/admin/promotion-rules/history">
											<Button variant="ghost" size="sm">
												{t(
													"admin.promotionRules.dashboard.recentActivity.details",
												)}
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
