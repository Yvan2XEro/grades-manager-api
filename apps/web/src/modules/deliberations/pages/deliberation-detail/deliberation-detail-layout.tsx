import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeliberationDetailActions } from "../../components/deliberation-detail-actions";
import { OverrideDecisionDialog } from "../../components/override-decision-dialog";
import { PromoteAdmittedDialog } from "../../components/promote-admitted-dialog";
import { useDeliberation } from "../../hooks/use-deliberation";
import { DeliberationContext } from "../../hooks/use-deliberation-context";
import { statusVariants } from "../../services/deliberation-status";
import type { OverrideState } from "../../types";

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

	if (deliberationQuery.isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
			</div>
		);
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

	const overrideDecision = (student: OverrideState) =>
		OverrideDecisionDialog.call({
			deliberationId: deliberationId!,
			...student,
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
			<div className="space-y-4">
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
									{delib.classRef?.name ?? "Deliberation"}
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
						onPromoteAdmitted={promoteAdmitted}
					/>
				</div>

				<HubNav tabs={TABS} basePath={basePath} />
			</div>
		</DeliberationContext.Provider>
	);
}
