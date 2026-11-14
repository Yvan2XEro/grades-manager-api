import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PromotionExecution, PromotionExecutionItem } from "../types";

const metadataOf = (execution: PromotionExecutionItem) =>
	(execution as PromotionExecution).metadata;

export function getExecutionsColumns(
	t: TFunction,
): ColumnDef<PromotionExecutionItem>[] {
	return [
		{
			id: "date",
			header: t("admin.promotionRules.history.table.date"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2 font-medium">
					<Clock className="h-4 w-4 text-muted-foreground" />
					{new Date(row.original.executedAt).toLocaleDateString()}
				</div>
			),
		},
		{
			id: "rule",
			header: t("admin.promotionRules.history.table.rule"),
			cell: ({ row }) => (
				<div className="font-medium">
					{metadataOf(row.original)?.ruleName || "N/A"}
				</div>
			),
		},
		{
			id: "classes",
			header: t("admin.promotionRules.history.table.classes"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2 text-sm">
					<span>{metadataOf(row.original)?.sourceClassName || "N/A"}</span>
					<ArrowRight className="h-3 w-3" />
					<span>{metadataOf(row.original)?.targetClassName || "N/A"}</span>
				</div>
			),
		},
		{
			id: "students",
			header: t("admin.promotionRules.history.table.students"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Badge variant="outline">
						{t("admin.promotionRules.history.badges.evaluated", {
							count: row.original.studentsEvaluated,
						})}
					</Badge>
					<Badge variant="default" className="bg-emerald-600">
						{t("admin.promotionRules.history.badges.promoted", {
							count: row.original.studentsPromoted,
						})}
					</Badge>
				</div>
			),
		},
		{
			id: "successRate",
			header: t("admin.promotionRules.history.table.successRate"),
			cell: ({ row: { original: execution } }) => (
				<div className="flex items-center gap-1">
					{execution.studentsPromoted === execution.studentsEvaluated ? (
						<CheckCircle2 className="h-4 w-4 text-emerald-600" />
					) : (
						<XCircle className="h-4 w-4 text-muted-foreground" />
					)}
					<span>
						{execution.studentsEvaluated > 0
							? (
									(execution.studentsPromoted / execution.studentsEvaluated) *
									100
								).toFixed(0)
							: 0}
						%
					</span>
				</div>
			),
		},
		{
			id: "executedBy",
			header: t("admin.promotionRules.history.table.executedBy"),
			// Would need to join with domainUsers to show name
			cell: () => (
				<span className="text-muted-foreground text-xs">
					{t("admin.promotionRules.history.table.user")}
				</span>
			),
		},
	];
}
