import { CheckCircle2, XCircle } from "lucide-react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogBody,
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
import { usePromotionExecutionDetails } from "../hooks/use-promotion-executions";
import type { EvaluationData, PromotionExecution } from "../types";

/** Read-only breakdown of one promotion execution, student by student. */
export const ExecutionDetailsDialog = createCallable<{ executionId: string }>(
	({ call, executionId }) => {
		const { t } = useTranslation();
		const { data: executionDetails } =
			usePromotionExecutionDetails(executionId);

		return (
			<Dialog open={!call.ended} onOpenChange={(open) => !open && call.end()}>
				<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{t("admin.promotionRules.history.details.title")}
						</DialogTitle>
						<DialogDescription>
							{t("admin.promotionRules.history.details.description")}
						</DialogDescription>
					</DialogHeader>

					<DialogBody>
						{executionDetails && (
							<div className="space-y-6">
								{/* Summary */}
								<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
									<Card>
										<CardContent className="pt-4">
											<div className="font-bold text-2xl">
												{executionDetails.execution.studentsEvaluated}
											</div>
											<p className="text-muted-foreground text-xs">
												{t(
													"admin.promotionRules.history.details.stats.evaluated",
												)}
											</p>
										</CardContent>
									</Card>
									<Card className="border-emerald-500/20 bg-emerald-500/5">
										<CardContent className="pt-4">
											<div className="font-bold text-2xl text-emerald-600">
												{executionDetails.execution.studentsPromoted}
											</div>
											<p className="text-muted-foreground text-xs">
												{t(
													"admin.promotionRules.history.details.stats.promoted",
												)}
											</p>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="pt-4">
											<div className="font-semibold text-lg">
												{new Date(
													executionDetails.execution.executedAt,
												).toLocaleString()}
											</div>
											<p className="text-muted-foreground text-xs">
												{t("admin.promotionRules.history.details.stats.date")}
											</p>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="pt-4">
											<div className="font-semibold text-lg">
												{(executionDetails.execution as PromotionExecution)
													.metadata?.ruleName || "N/A"}
											</div>
											<p className="text-muted-foreground text-xs">
												{t("admin.promotionRules.history.details.stats.rule")}
											</p>
										</CardContent>
									</Card>
								</div>

								{/* Student Results */}
								<div>
									<h3 className="mb-4 font-semibold text-lg">
										{t(
											"admin.promotionRules.history.details.studentResults.title",
										)}
									</h3>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>
													{t(
														"admin.promotionRules.history.details.studentResults.studentId",
													)}
												</TableHead>
												<TableHead>
													{t(
														"admin.promotionRules.history.details.studentResults.status",
													)}
												</TableHead>
												<TableHead>
													{t(
														"admin.promotionRules.history.details.studentResults.average",
													)}
												</TableHead>
												<TableHead>
													{t(
														"admin.promotionRules.history.details.studentResults.credits",
													)}
												</TableHead>
												<TableHead>
													{t(
														"admin.promotionRules.history.details.studentResults.successRate",
													)}
												</TableHead>
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
															<Badge
																variant="default"
																className="bg-emerald-600"
															>
																<CheckCircle2 className="mr-1 h-3 w-3" />
																{t(
																	"admin.promotionRules.history.details.studentResults.promoted",
																)}
															</Badge>
														) : (
															<Badge variant="secondary">
																<XCircle className="mr-1 h-3 w-3" />
																{t(
																	"admin.promotionRules.history.details.studentResults.notPromoted",
																)}
															</Badge>
														)}
													</TableCell>
													<TableCell>
														{(result.evaluationData as EvaluationData)
															.overallAverage
															? `${(
																	(result.evaluationData as EvaluationData)
																		.overallAverage
																).toFixed(2)}/20`
															: "N/A"}
													</TableCell>
													<TableCell>
														{(result.evaluationData as EvaluationData)
															.creditsEarned !== undefined
															? `${(result.evaluationData as EvaluationData).creditsEarned}/${(result.evaluationData as EvaluationData).requiredCredits}`
															: "N/A"}
													</TableCell>
													<TableCell>
														{(result.evaluationData as EvaluationData)
															.successRate !== undefined
															? `${((result.evaluationData as EvaluationData).successRate * 100).toFixed(0)}%`
															: "N/A"}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						)}
					</DialogBody>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
