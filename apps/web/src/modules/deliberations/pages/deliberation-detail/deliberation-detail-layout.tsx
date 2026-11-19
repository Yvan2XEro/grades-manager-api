import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { HubLayout } from "@/components/layouts/ListLayout";
import { HubNav } from "@/components/navigation/HubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbEntity } from "@/hooks/useBreadcrumbs";
import { DeliberationDetailActions } from "../../components/deliberation-detail-actions";
import { OverrideDecisionDialog } from "../../components/override-decision-dialog";
import { PromoteAdmittedDialog } from "../../components/promote-admitted-dialog";
import { useDeliberation } from "../../hooks/use-deliberation";
import { DeliberationContext } from "../../hooks/use-deliberation-context";
import { statusVariants } from "../../services/deliberation-status";
import { JURY_PRESIDENT_ROLE } from "../../services/jury";
import type { StudentResult } from "../../types";

const TABS = [
	{
		path: "results",
		labelKey: "admin.deliberations.detail.tabs.results",
	},
	{
		path: "jury",
		labelKey: "admin.deliberations.detail.tabs.jury",
	},
	{
		path: "activity",
		labelKey: "admin.deliberations.detail.tabs.activity",
	},
] as const;

export default function DeliberationDetail() {
	const { deliberationId } = useParams<{ deliberationId: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { deliberationQuery, logsQuery } = useDeliberation(deliberationId);
	useBreadcrumbEntity(deliberationId, deliberationQuery.data?.classRef?.name);

	if (deliberationQuery.isLoading) {
		return <DeliberationDetailSkeleton />;
	}

	const delib = deliberationQuery.data;
	if (!delib) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("common.notFound")}
			</div>
		);
	}

	const results = delib.studentResults ?? [];
	const status = delib.status;
	const basePath = `/academic-results/deliberations/${deliberationId}`;

	const overrideDecision = (result: StudentResult) =>
		OverrideDecisionDialog.call({
			deliberationId: deliberationId!,
			result,
		});

	const promoteAdmitted = () => {
		if (!delib.classId) return;
		PromoteAdmittedDialog.call({
			deliberationId: deliberationId!,
			sourceClassId: delib.classId,
			admittedCount: results.filter(
				(r) =>
					r.finalDecision === "admitted" || r.finalDecision === "compensated",
			).length,
		});
	};

	return (
		<DeliberationContext.Provider
			value={{
				deliberationId: deliberationId!,
				delib,
				isOpen: status === "open",
				isDraft: status === "draft",
				isClosed: status === "closed",
				isSigned: status === "signed",
				logsLoading: logsQuery.isLoading,
				logs: logsQuery.data?.items ?? [],
				overrideDecision,
				promoteAdmitted,
			}}
		>
			<HubLayout>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate("/academic-results/deliberations")}
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-foreground">
									{delib.classRef?.name ??
										t("admin.deliberations.detail.fallbackTitle")}
								</h1>
								<Badge variant={statusVariants[status] ?? "outline"}>
									{t(`admin.deliberations.status.${status}`)}
								</Badge>
								<Badge variant="outline">
									{t(`admin.deliberations.type.${delib.type}`)}
								</Badge>
							</div>
							<p className="text-muted-foreground text-xs">
								{delib.academicYear?.name ?? ""}{" "}
								{delib.semester ? `— ${delib.semester.name}` : ""}
							</p>
						</div>
					</div>

					<DeliberationDetailActions
						deliberationId={deliberationId!}
						status={status}
						pendingCount={
							results.filter(
								(r) => (r.finalDecision ?? "pending") === "pending",
							).length
						}
						promoted={!!delib.promotion}
						hasPresident={
							!!delib.presidentId ||
							(delib.juryMembers ?? []).some(
								(m) => m.role === JURY_PRESIDENT_ROLE,
							)
						}
						onPromoteAdmitted={promoteAdmitted}
					/>
				</div>

				<HubNav tabs={TABS} basePath={basePath} />
			</HubLayout>
		</DeliberationContext.Provider>
	);
}

/** Placeholder of the detail page while the deliberation loads. */
function DeliberationDetailSkeleton() {
	return (
		<HubLayout>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Skeleton className="h-9 w-9 rounded-md" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-64" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
				<Skeleton className="h-9 w-40" />
			</div>
			<Skeleton className="h-9 w-80" />
			<div className="grid gap-4 md:grid-cols-4">
				{[0, 1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>
			<div className="space-y-2">
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-12 w-full" />
				))}
			</div>
		</HubLayout>
	);
}
