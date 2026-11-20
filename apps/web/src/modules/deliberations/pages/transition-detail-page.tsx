import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Confirm } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreadcrumbEntity } from "@/hooks/useBreadcrumbs";
import { ResolveItemSheet } from "../components/resolve-item-sheet";
import { TransitionAuditTimeline } from "../components/transition-audit-timeline";
import { TransitionHeader } from "../components/transition-header";
import { TransitionItemsCard } from "../components/transition-items-card";
import { TransitionReadinessCard } from "../components/transition-readiness-card";
import { TransitionSummaryMetrics } from "../components/transition-summary-metrics";
import { useTransitionDetail } from "../hooks/use-transition-detail";
import { count, summaryOf } from "../services/transition-status";
import type { TransitionAction, TransitionItem } from "../types";

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
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const transition = transitionQuery.data ?? null;
	useBreadcrumbEntity(
		id,
		transition?.sourceYear?.name && transition.targetYear?.name
			? `${transition.sourceYear.name} → ${transition.targetYear.name}`
			: null,
	);

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

	const editable = ["draft", "ready"].includes(transition.status);

	const resolveItems = async (items: TransitionItem[]) => {
		if (items.length === 0) return;
		const resolved = await ResolveItemSheet.call({
			items,
			targetAcademicYearId: transition.targetAcademicYearId,
		});
		if (resolved) {
			setSelectedIds(new Set());
			await invalidate();
		}
	};
	const resolveSelected = () =>
		resolveItems(
			(itemsQuery.data?.items ?? []).filter((item) => selectedIds.has(item.id)),
		);

	// Every workflow step is confirmed with what it does; execution states
	// how many students are moved.
	const confirmCopy = (action: TransitionAction) => {
		const counts = {
			total: count(summary, "total"),
			promote: count(summary, "promote"),
			repeat: count(summary, "repeat"),
			graduate: count(summary, "graduate"),
			exclude: count(summary, "exclude"),
		};
		switch (action) {
			case "cancel":
				return {
					title: t("admin.academicYearTransitions.cancelConfirm.title"),
					description: t("admin.academicYearTransitions.cancelConfirm.message"),
					confirmLabel: t(
						"admin.academicYearTransitions.cancelConfirm.confirm",
					),
					cancelLabel: t("admin.academicYearTransitions.cancelConfirm.keep"),
					destructive: true,
				};
			case "submit":
				return {
					title: t("admin.academicYearTransitions.submitConfirm.title"),
					description: t(
						"admin.academicYearTransitions.submitConfirm.message",
						{ count: counts.total },
					),
					confirmLabel: t("admin.academicYearTransitions.actions.submit"),
					destructive: false,
				};
			case "approve":
				return {
					title: t("admin.academicYearTransitions.approveConfirm.title"),
					description: t(
						"admin.academicYearTransitions.approveConfirm.message",
					),
					confirmLabel: t("admin.academicYearTransitions.actions.approve"),
					destructive: false,
				};
			case "execute":
				return {
					title: t("admin.academicYearTransitions.executeConfirm.title", {
						target: transition.targetYear?.name ?? "",
					}),
					description: (
						<div className="space-y-2">
							<p>
								{t("admin.academicYearTransitions.executeConfirm.message", {
									count: counts.total,
									target: transition.targetYear?.name ?? "",
								})}
							</p>
							<ul className="list-disc space-y-0.5 pl-5">
								{(["promote", "repeat", "graduate", "exclude"] as const).map(
									(key) =>
										counts[key] > 0 ? (
											<li key={key}>
												{t(
													`admin.academicYearTransitions.executeConfirm.${key}`,
													{ count: counts[key] },
												)}
											</li>
										) : null,
								)}
							</ul>
							<p>{t("admin.academicYearTransitions.executeConfirm.final")}</p>
						</div>
					),
					confirmLabel: t("admin.academicYearTransitions.actions.execute"),
					destructive: false,
				};
		}
	};

	const runAction = async (action: TransitionAction) => {
		await Confirm.call({
			...confirmCopy(action),
			mutationFn: async (call) => {
				try {
					await actionMutation.mutateAsync({ action });
					call.end(true);
				} catch {
					// error toast shown by the mutation
					call.end(false);
				}
			},
		});
	};

	const showBlocked = () => {
		filters.setOutcome("all");
		filters.setItemStatus("blocked");
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
				onAction={runAction}
				onShowBlocked={showBlocked}
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
						onSelectItem={(item) => editable && resolveItems([item])}
						selectable={editable}
						selectedIds={selectedIds}
						onSelectionChange={setSelectedIds}
						onResolveSelected={resolveSelected}
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
