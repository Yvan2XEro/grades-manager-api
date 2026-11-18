import {
	CalendarCheck,
	CheckCircle2,
	CreditCard,
	FileText,
	GraduationCap,
	ServerCog,
	XCircle,
} from "lucide-react";
import type { NotifItem, TFn } from "../../types";

type Category =
	| "academic"
	| "financial"
	| "enrollment"
	| "documents"
	| "system";

export type NotifActionConfig = {
	icon: React.ReactNode;
	labelKey: string;
	subtitleFn?: (payload: Record<string, unknown>, t: TFn) => string;
	toFn?: (payload: Record<string, unknown>) => string | undefined;
	priority: "high" | "medium" | "low";
	category: Category;
	/** action = requires user to do something; info = informational only */
	kind: "action" | "info";
};

export const NOTIF_ACTION_CONFIGS: Record<string, NotifActionConfig> = {
	"deliberation.published": {
		icon: <GraduationCap className="h-4 w-4 text-violet-600" />,
		labelKey: "student.pendingActions.resultsPublished",
		priority: "high",
		category: "academic",
		kind: "info",
		toFn: () => "/",
	},
	"grade.approved": {
		icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
		labelKey: "student.pendingActions.gradesApproved",
		subtitleFn: (p) => String(p.examName ?? ""),
		priority: "medium",
		category: "academic",
		kind: "info",
		toFn: () => "/",
	},
	"grade.rejected": {
		icon: <XCircle className="h-4 w-4 text-destructive" />,
		labelKey: "student.pendingActions.gradesRejected",
		subtitleFn: (p) => String(p.examName ?? ""),
		priority: "high",
		category: "academic",
		kind: "info",
		toFn: () => "/",
	},
	"fee.payment_confirmed": {
		icon: <CreditCard className="h-4 w-4 text-emerald-600" />,
		labelKey: "student.pendingActions.paymentConfirmed",
		subtitleFn: (p) =>
			p.amount && p.currency
				? `${Number(p.amount).toLocaleString()} ${p.currency}`
				: "",
		priority: "low",
		category: "financial",
		kind: "info",
		toFn: () => "/fees",
	},
	"payment.pending": {
		icon: <CreditCard className="h-4 w-4 text-amber-500" />,
		labelKey: "student.pendingActions.paymentPending",
		priority: "high",
		category: "financial",
		kind: "action",
		toFn: () => "/fees",
	},
	"enrollment.window_open": {
		icon: <CalendarCheck className="h-4 w-4 text-emerald-600" />,
		labelKey: "student.pendingActions.enrollmentWindowOpen",
		priority: "high",
		category: "enrollment",
		kind: "action",
		toFn: () => "/",
	},
	"document.available": {
		icon: <FileText className="h-4 w-4 text-sky-600" />,
		labelKey: "student.pendingActions.documentAvailable",
		subtitleFn: (p) => String(p.documentKind ?? ""),
		priority: "low",
		category: "documents",
		kind: "info",
		toFn: () => "/documents",
	},
	"batch_job.completed": {
		icon: <ServerCog className="h-4 w-4 text-emerald-600" />,
		labelKey: "student.pendingActions.jobCompleted",
		priority: "low",
		category: "system",
		kind: "info",
	},
	"batch_job.failed": {
		icon: <ServerCog className="h-4 w-4 text-destructive" />,
		labelKey: "student.pendingActions.jobFailed",
		priority: "medium",
		category: "system",
		kind: "info",
	},
};

/** Resolves the label, subtitle and link shown for a notification. */
export function resolveNotifAction(item: NotifItem, t: TFn) {
	const cfg = NOTIF_ACTION_CONFIGS[item.type];
	const payload = (item.payload as Record<string, unknown>) ?? {};
	const subtitle = cfg?.subtitleFn ? cfg.subtitleFn(payload, t) : "";
	const to = cfg?.toFn ? cfg.toFn(payload) : undefined;
	const label = t(
		(cfg?.labelKey ?? "student.pendingActions.generic") as Parameters<
			typeof t
		>[0],
		{
			defaultValue: item.type
				.replace(/[._-]/g, " ")
				.replace(/\b\w/g, (c) => c.toUpperCase()),
		},
	);
	return { cfg, subtitle, to, label };
}
