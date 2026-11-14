import { useQuery } from "@tanstack/react-query";
import {
	CheckCircle2,
	History,
	Lock,
	RefreshCw,
	Send,
	XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";
import { formatDateTime } from "../services/exam-format";
import type { AuditEvent } from "../types";

const AUDIT_ACTION_CONFIG: Record<
	string,
	{ icon: React.ReactNode; labelKey: string; color: string }
> = {
	submit: {
		icon: <Send className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.submit",
		color: "text-blue-600",
	},
	resubmit: {
		icon: <RefreshCw className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.resubmit",
		color: "text-blue-600",
	},
	approve: {
		icon: <CheckCircle2 className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.approve",
		color: "text-emerald-600",
	},
	reject: {
		icon: <XCircle className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.reject",
		color: "text-destructive",
	},
	lock: {
		icon: <Lock className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.lock",
		color: "text-muted-foreground",
	},
};

export function ExamAuditTimeline({ examId }: { examId: string }) {
	const { t } = useTranslation();
	const { data: events, isLoading } = useQuery(
		trpc.exams.getAuditHistory.queryOptions({ id: examId }),
	);

	if (isLoading) {
		return (
			<div className="mt-3 flex items-center gap-2 text-muted-foreground text-xs">
				<RefreshCw className="h-3 w-3 animate-spin" />
				{t("common.loading", { defaultValue: "Loading…" })}
			</div>
		);
	}

	if (!events || events.length === 0) {
		return (
			<p className="mt-3 text-muted-foreground text-xs italic">
				{t("dean.auditHistory.empty", { defaultValue: "No events recorded." })}
			</p>
		);
	}

	return (
		<div className="mt-3 space-y-2 border-t pt-3">
			<p className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
				<History className="h-3 w-3" />
				{t("dean.auditHistory.title", { defaultValue: "Audit trail" })}
			</p>
			<ol className="relative ml-1.5 space-y-3 border-muted border-l pl-4">
				{events.map((ev: AuditEvent) => {
					const cfg = AUDIT_ACTION_CONFIG[ev.action];
					const actorName = ev.actor
						? `${ev.actor.firstName} ${ev.actor.lastName}`
						: t("dean.auditHistory.system", { defaultValue: "System" });
					return (
						<li key={ev.id} className="relative">
							<span className="-left-[1.4rem] absolute flex h-5 w-5 items-center justify-center rounded-full border bg-background">
								<span className={cfg?.color ?? "text-muted-foreground"}>
									{cfg?.icon ?? <History className="h-3 w-3" />}
								</span>
							</span>
							<div>
								<p className="font-medium text-foreground text-xs">
									{t(cfg?.labelKey ?? ev.action, { defaultValue: ev.action })}{" "}
									<span className="font-normal text-muted-foreground">
										{t("dean.auditHistory.by", { defaultValue: "by" })}{" "}
										{actorName}
									</span>
								</p>
								{ev.reason && (
									<p className="mt-0.5 rounded bg-destructive/8 px-2 py-0.5 text-[11px] text-destructive">
										{ev.reason}
									</p>
								)}
								<p className="mt-0.5 text-[10px] text-muted-foreground/70">
									{formatDateTime(ev.createdAt)}
								</p>
							</div>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
