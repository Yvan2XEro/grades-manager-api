import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationReview } from "../hooks/use-application-review";
import { isAwaitingDecision } from "../services/application-status";
import type { ApplicationDetail } from "../types";
import { ConvertApplicationSection } from "./convert-application-section";
import { ReviewDecisionForm } from "./review-decision-form";

/** "Decision" tab: past notes, then review, conversion or the final state. */
export function AdmissionDecisionTab({
	app,
	review,
}: {
	app: ApplicationDetail;
	review: ApplicationReview;
}) {
	const { t } = useTranslation();
	return (
		<>
			{app.reviewNotes && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">
							{t("admissions.admin.reviewNotes")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm leading-relaxed">{app.reviewNotes}</p>
					</CardContent>
				</Card>
			)}

			{app.convertedStudentId ? (
				<div className="rounded-xl border bg-emerald-500/10 p-6 text-emerald-700 dark:text-emerald-400">
					<CheckCircle2 className="mb-2 size-6" />
					<p className="font-semibold">{t("admissions.admin.converted")}</p>
				</div>
			) : isAwaitingDecision(app.status) ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">
							{t("admissions.admin.reviewTitle")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<ReviewDecisionForm status={app.status} review={review} />
					</CardContent>
				</Card>
			) : app.status === "accepted" ? (
				<ConvertApplicationSection app={app} review={review} />
			) : (
				<div className="rounded-xl border bg-muted/40 p-6">
					<p className="text-muted-foreground text-sm">
						{t(`admissions.statuses.${app.status}`)} —{" "}
						{t("admissions.admin.terminalState")}
					</p>
				</div>
			)}
		</>
	);
}
