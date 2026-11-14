import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "../services/exam-format";
import type { PagedExam } from "../types";
import { ExamAuditTimeline } from "./exam-audit-timeline";
import { ExamMetaLine, ExamTypeTag } from "./exam-meta";

const STATUS_CONFIG = {
	approved: {
		icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
		variant: "success" as const,
		labelKey: "exam.status.approved",
	},
	rejected: {
		icon: <XCircle className="h-4 w-4 text-destructive" />,
		variant: "destructive" as const,
		labelKey: "exam.status.rejected",
	},
};

/** An approved or rejected exam, with its audit trail behind a toggle. */
export function ApprovalHistoryCard({
	exam,
	expanded,
	onToggleExpanded,
}: {
	exam: PagedExam;
	expanded: boolean;
	onToggleExpanded: () => void;
}) {
	const { t } = useTranslation();
	const cfg = STATUS_CONFIG[exam.status as keyof typeof STATUS_CONFIG];
	const validatedDate = formatShortDate(exam.validatedAt);

	return (
		<div className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm">
			<div className="mt-0.5 shrink-0">{cfg?.icon}</div>

			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-semibold text-foreground text-sm">
						{exam.name}
					</span>
					<ExamTypeTag type={exam.type} />
					<span className="text-muted-foreground text-xs">
						{exam.percentage}%
					</span>
				</div>

				<ExamMetaLine exam={exam} />

				{validatedDate && (
					<p className="mt-1 text-muted-foreground text-xs">
						{exam.status === "approved"
							? t("dean.history.approvedOn", {
									date: validatedDate,
								})
							: t("dean.history.rejectedOn", {
									date: validatedDate,
								})}
					</p>
				)}
				{exam.status === "rejected" && exam.rejectionReason && (
					<p className="mt-1.5 rounded-md bg-destructive/8 px-2.5 py-1 text-destructive text-xs">
						<span className="font-semibold">
							{t("dean.history.rejectionReason", {
								defaultValue: "Reason",
							})}
							:{" "}
						</span>
						{exam.rejectionReason}
					</p>
				)}

				<button
					type="button"
					className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
					onClick={onToggleExpanded}
				>
					{expanded ? (
						<ChevronUp className="h-3 w-3" />
					) : (
						<ChevronDown className="h-3 w-3" />
					)}
					{t("dean.auditHistory.toggle", {
						defaultValue: "Audit trail",
					})}
				</button>

				{expanded && <ExamAuditTimeline examId={exam.id} />}
			</div>

			{cfg && (
				<Badge variant={cfg.variant} className="shrink-0 text-xs">
					{t(cfg.labelKey)}
				</Badge>
			)}
		</div>
	);
}
