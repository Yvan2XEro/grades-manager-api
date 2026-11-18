import type { LucideIcon } from "lucide-react";
import {
	Bell,
	CheckCircle2,
	CreditCard,
	FileText,
	GraduationCap,
	ServerCog,
	XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TFn = (key: string, opts?: Record<string, unknown>) => string;

type NotifConfig = {
	icon: LucideIcon;
	/** Colour of the icon. */
	iconClass: string;
	labelKey: string;
	subtitleFn?: (payload: Record<string, unknown>, t: TFn) => string;
	toFn?: (payload: Record<string, unknown>) => string | undefined;
};

const batchJobSubtitle =
	(
		key: string,
		extra: (p: Record<string, unknown>) => Record<string, unknown>,
	) =>
	(p: Record<string, unknown>, t: TFn) => {
		const jobType = p.jobType
			? t(`admin.batchJobs.types.${p.jobType}`, {
					defaultValue: String(p.jobType),
				})
			: "";
		return t(key, { jobType, ...extra(p) });
	};

/** Display config of the in-app notifications, by notification type. */
const NOTIF_CONFIGS: Record<string, NotifConfig> = {
	"fee.payment_confirmed": {
		icon: CreditCard,
		iconClass: "text-emerald-600",
		labelKey: "notifications.types.fee_payment_confirmed",
		subtitleFn: (p) =>
			p.amount && p.currency
				? `${Number(p.amount).toLocaleString()} ${p.currency}`
				: String(p.reference ?? ""),
	},
	"grade.approved": {
		icon: CheckCircle2,
		iconClass: "text-emerald-600",
		labelKey: "notifications.types.grade_approved",
		subtitleFn: (p) => String(p.examName ?? ""),
		toFn: (p) => (p.classCourseId ? `/grades/${p.classCourseId}` : undefined),
	},
	"grade.rejected": {
		icon: XCircle,
		iconClass: "text-destructive",
		labelKey: "notifications.types.grade_rejected",
		subtitleFn: (p) => (p.reason ? String(p.reason) : String(p.examName ?? "")),
		toFn: (p) => (p.classCourseId ? `/grades/${p.classCourseId}` : undefined),
	},
	"deliberation.published": {
		icon: GraduationCap,
		iconClass: "text-violet-600",
		labelKey: "notifications.types.deliberation_published",
		toFn: () => "/",
	},
	"payment.pending": {
		icon: CreditCard,
		iconClass: "text-amber-500",
		labelKey: "notifications.types.payment_pending",
		toFn: () => "/fees",
	},
	"enrollment.window_open": {
		icon: GraduationCap,
		iconClass: "text-emerald-600",
		labelKey: "notifications.types.enrollment_window_open",
		toFn: () => "/",
	},
	"batch_job.completed": {
		icon: ServerCog,
		iconClass: "text-emerald-600",
		labelKey: "notifications.types.batch_job_completed",
		subtitleFn: batchJobSubtitle(
			"notifications.batchJob.completedSubtitle",
			(p) => ({ itemsProcessed: p.itemsProcessed ?? 0 }),
		),
		toFn: (p) => (p.jobId ? `/batch-jobs/${p.jobId}` : undefined),
	},
	"batch_job.failed": {
		icon: ServerCog,
		iconClass: "text-destructive",
		labelKey: "notifications.types.batch_job_failed",
		subtitleFn: batchJobSubtitle(
			"notifications.batchJob.failedSubtitle",
			(p) => ({
				error: p.error ? String(p.error) : "",
			}),
		),
		toFn: (p) => (p.jobId ? `/batch-jobs/${p.jobId}` : undefined),
	},
	"document.available": {
		icon: FileText,
		iconClass: "text-sky-600",
		labelKey: "notifications.types.document_available",
		subtitleFn: (p) => String(p.documentKind ?? ""),
		toFn: () => "/documents",
	},
};

const GENERIC_CONFIG: NotifConfig = {
	icon: Bell,
	iconClass: "text-muted-foreground",
	labelKey: "notifications.types.generic",
};

/** "grade.approved" → "Grade Approved". */
export function humanizeType(type: string) {
	return type.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Label, subtitle, link and icon of a notification of the current user.
 * `iconSize` is the size classes of the icon (e.g. "h-4 w-4").
 */
export function resolveNotification(
	item: { type: string; payload: unknown },
	t: TFn,
	iconSize: string,
) {
	const cfg = NOTIF_CONFIGS[item.type] ?? GENERIC_CONFIG;
	const payload = (item.payload as Record<string, unknown>) ?? {};
	const Icon = cfg.icon;
	return {
		icon: <Icon className={cn(iconSize, cfg.iconClass)} />,
		label: t(cfg.labelKey, { defaultValue: humanizeType(item.type) }),
		subtitle: cfg.subtitleFn ? cfg.subtitleFn(payload, t) : "",
		to: cfg.toFn ? cfg.toFn(payload) : undefined,
	};
}

export function timeAgo(date: string | Date, t: TFn) {
	const diff = Date.now() - new Date(date).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return t("notifications.timeAgo.justNow");
	if (mins < 60) return t("notifications.timeAgo.minutes", { count: mins });
	const hours = Math.floor(mins / 60);
	if (hours < 24) return t("notifications.timeAgo.hours", { count: hours });
	return t("notifications.timeAgo.days", { count: Math.floor(hours / 24) });
}
