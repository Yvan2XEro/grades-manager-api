import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpcClient } from "@/utils/trpc";
import { ArrowRight, CheckCircle2, Clock, Eye, XCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export function ExecutionHistoryPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
		null,
	);

	// Fetch executions
	const { data: executionsData, isLoading } = useQuery({
		queryKey: ["promotionExecutions"],
		queryFn: async () => trpcClient.promotionRules.listExecutions.query({}),
	});

	// Fetch execution details
	const { data: executionDetails } = useQuery({
		queryKey: ["promotionExecutionDetails", selectedExecutionId],
		queryFn: async () =>
			trpcClient.promotionRules.getExecutionDetails.query({
				executionId: selectedExecutionId!,
			}),
		enabled: !!selectedExecutionId,
	});

	return (
		<div className="container mx-auto py-8 space-y-6">
			{/* Header */}
			<div className="space-y-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/admin/promotion-rules")}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.actions.back")}
				</Button>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{t("admin.promotionRules.history.title")}</h1>
					<p className="text-muted-foreground mt-1">
						{t("admin.promotionRules.history.subtitle")}
					</p>
				</div>
			</div>

			{/* Executions List */}
			<Card>
				<CardHeader>
					<CardTitle>{t("admin.promotionRules.history.table.title")}</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="h-16 bg-muted animate-pulse rounded" />
							))}
						</div>
					) : executionsData?.items && executionsData.items.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("admin.promotionRules.history.table.date")}</TableHead>
									<TableHead>{t("admin.promotionRules.history.table.rule")}</TableHead>
									<TableHead>{t("admin.promotionRules.history.table.classes")}</TableHead>
									<TableHead>{t("admin.promotionRules.history.table.students")}</TableHead>
									<TableHead>{t("admin.promotionRules.history.table.successRate")}</TableHead>
									<TableHead>{t("admin.promotionRules.history.table.executedBy")}</TableHead>
									<TableHead className="text-right">{t("admin.promotionRules.history.table.actions")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{executionsData.items.map((execution) => (
									<TableRow key={execution.id}>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												<Clock className="w-4 h-4 text-muted-foreground" />
												{new Date(execution.executedAt).toLocaleDateString()}
											</div>
										</TableCell>
										<TableCell>
											<div className="font-medium">
												{(execution as any).metadata?.ruleName || "N/A"}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2 text-sm">
												<span>
													{(execution as any).metadata?.sourceClassName ||
														"N/A"}
												</span>
												<ArrowRight className="w-3 h-3" />
												<span>
													{(execution as any).metadata?.targetClassName ||
														"N/A"}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Badge variant="outline">
													{t("admin.promotionRules.history.badges.evaluated", { count: execution.studentsEvaluated })}
												</Badge>
												<Badge variant="default" className="bg-green-500">
													{t("admin.promotionRules.history.badges.promoted", { count: execution.studentsPromoted })}
												</Badge>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												{execution.studentsPromoted ===
												execution.studentsEvaluated ? (
													<CheckCircle2 className="w-4 h-4 text-green-600" />
												) : (
													<XCircle className="w-4 h-4 text-amber-600" />
												)}
												<span>
													{execution.studentsEvaluated > 0
														? (
																(execution.studentsPromoted /
																	execution.studentsEvaluated) *
																100
															).toFixed(0)
														: 0}
													%
												</span>
											</div>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{/* Would need to join with domainUsers to show name */}
											{t("admin.promotionRules.history.table.user")}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelectedExecutionId(execution.id)}
											>
												<Eye className="w-4 h-4 mr-1" />
												{t("admin.promotionRules.history.table.viewDetails")}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="text-center py-12">
							<p className="text-muted-foreground">{t("admin.promotionRules.history.emptyState")}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Execution Details Dialog */}
			<Dialog
				open={!!selectedExecutionId}
				onOpenChange={(open) => !open && setSelectedExecutionId(null)}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("admin.promotionRules.history.details.title")}</DialogTitle>
						<DialogDescription>
							{t("admin.promotionRules.history.details.description")}
						</DialogDescription>
					</DialogHeader>

					{executionDetails && (
						<div className="space-y-6">
							{/* Summary */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<Card>
									<CardContent className="pt-4">
										<div className="text-2xl font-bold">
											{executionDetails.execution.studentsEvaluated}
										</div>
										<p className="text-xs text-muted-foreground">{t("admin.promotionRules.history.details.stats.evaluated")}</p>
									</CardContent>
								</Card>
								<Card className="border-green-500/30 bg-green-50/20">
									<CardContent className="pt-4">
										<div className="text-2xl font-bold text-green-600">
											{executionDetails.execution.studentsPromoted}
										</div>
										<p className="text-xs text-muted-foreground">{t("admin.promotionRules.history.details.stats.promoted")}</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="pt-4">
										<div className="text-lg font-semibold">
											{new Date(
												executionDetails.execution.executedAt,
											).toLocaleString()}
										</div>
										<p className="text-xs text-muted-foreground">{t("admin.promotionRules.history.details.stats.date")}</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="pt-4">
										<div className="text-lg font-semibold">
											{(executionDetails.execution as any).metadata
												?.ruleName || "N/A"}
										</div>
										<p className="text-xs text-muted-foreground">{t("admin.promotionRules.history.details.stats.rule")}</p>
									</CardContent>
								</Card>
							</div>

							{/* Student Results */}
							<div>
								<h3 className="text-lg font-semibold mb-4">{t("admin.promotionRules.history.details.studentResults.title")}</h3>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("admin.promotionRules.history.details.studentResults.studentId")}</TableHead>
											<TableHead>{t("admin.promotionRules.history.details.studentResults.status")}</TableHead>
											<TableHead>{t("admin.promotionRules.history.details.studentResults.average")}</TableHead>
											<TableHead>{t("admin.promotionRules.history.details.studentResults.credits")}</TableHead>
											<TableHead>{t("admin.promotionRules.history.details.studentResults.successRate")}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{executionDetails.results.map((result) => (
											<TableRow key={result.id}>
												<TableCell className="font-medium">
													{result.studentId}
												</TableCell>
												<TableCell>
													{result.wasPromoted ? (
														<Badge variant="default" className="bg-green-500">
															<CheckCircle2 className="w-3 h-3 mr-1" />
															{t("admin.promotionRules.history.details.studentResults.promoted")}
														</Badge>
													) : (
														<Badge variant="secondary">
															<XCircle className="w-3 h-3 mr-1" />
															{t("admin.promotionRules.history.details.studentResults.notPromoted")}
														</Badge>
													)}
												</TableCell>
												<TableCell>
													{(result.evaluationData as any).overallAverage
														? `${(
																(result.evaluationData as any)
																	.overallAverage
															).toFixed(2)}/20`
														: "N/A"}
												</TableCell>
												<TableCell>
													{(result.evaluationData as any).creditsEarned !==
													undefined
														? `${(result.evaluationData as any).creditsEarned}/${(result.evaluationData as any).requiredCredits}`
														: "N/A"}
												</TableCell>
												<TableCell>
													{(result.evaluationData as any).successRate !==
													undefined
														? `${((result.evaluationData as any).successRate * 100).toFixed(0)}%`
														: "N/A"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
