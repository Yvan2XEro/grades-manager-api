import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResolveItemSheet } from "../components/resolve-item-sheet";
import { TransitionAuditTimeline } from "../components/transition-audit-timeline";
import { TransitionHeader } from "../components/transition-header";
import { TransitionItemsCard } from "../components/transition-items-card";
import { TransitionReadinessCard } from "../components/transition-readiness-card";
import { TransitionSummaryMetrics } from "../components/transition-summary-metrics";
import { useTransitionDetail } from "../hooks/use-transition-detail";
import { summaryOf } from "../services/transition-status";
import type { TransitionItem } from "../types";

export default function TransitionDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const {
		filters,
		transitionQuery,
		itemsQuery,
		readinessQuery,
		auditQuery,
		invalidate,
		actionMutation,
	} = useTransitionDetail(id);
	const transition = transitionQuery.data ?? null;

	if (transitionQuery.isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!transition) {
		return (
			<div className="py-16 text-center text-muted-foreground">
				{t("admin.academicYearTransitions.empty.notFound")}
			</div>
		);
	}

	const summary = summaryOf(transition);

	const resolveItem = async (item: TransitionItem) => {
		const resolved = await ResolveItemSheet.call({
			item,
			targetAcademicYearId: transition?.targetAcademicYearId,
		});
		if (resolved) await invalidate();
	};

	return (
		<div className="space-y-6">
			<div>
				<Button
					variant="ghost"
					size="sm"
					className="mb-4 gap-2"
					onClick={() => navigate("/academic-results/promotion")}
				>
					<ArrowLeft className="size-4" />
					{t("common.actions.back")}
				</Button>
			</div>

			<TransitionHeader
				transition={transition}
				summary={summary}
				onAction={(action) => actionMutation.mutate({ action })}
				isPending={actionMutation.isPending}
			/>

			<TransitionSummaryMetrics summary={summary} />

			<Tabs defaultValue="students">
				<TabsList>
					<TabsTrigger value="students">
						{t("admin.academicYearTransitions.tabs.students")}
					</TabsTrigger>
					<TabsTrigger value="readiness">
						{t("admin.academicYearTransitions.tabs.readiness")}
					</TabsTrigger>
					<TabsTrigger value="audit">
						{t("admin.academicYearTransitions.tabs.audit")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="students" className="mt-4">
					<TransitionItemsCard
						items={itemsQuery.data?.items}
						search={filters.search}
						onSearchChange={filters.setSearch}
						itemStatus={filters.itemStatus}
						onItemStatusChange={filters.setItemStatus}
						outcome={filters.outcome}
						onOutcomeChange={filters.setOutcome}
						onSelectItem={resolveItem}
					/>
				</TabsContent>

				<TabsContent value="readiness" className="mt-4">
					<TransitionReadinessCard
						readiness={readinessQuery.data}
						isLoading={readinessQuery.isLoading}
					/>
				</TabsContent>

				<TabsContent value="audit" className="mt-4">
					<TransitionAuditTimeline
						audit={auditQuery.data}
						isLoading={auditQuery.isLoading}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
