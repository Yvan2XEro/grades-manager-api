import { CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";
import type { StatusFilter } from "../types";

export const STATUS_TAB_KEYS: StatusFilter[] = [
	"all",
	"pending",
	"retrying",
	"sent",
	"failed",
];

export const statusConfig = {
	pending: {
		icon: <Clock className="h-4 w-4" />,
		labelKey: "admin.notifications.status.pending",
		badge: "bg-muted text-foreground border-border",
		dot: "bg-muted-foreground",
	},
	retrying: {
		icon: <RotateCcw className="h-4 w-4" />,
		labelKey: "admin.notifications.status.retrying",
		badge: "bg-amber-50 text-amber-700 border-amber-200",
		dot: "bg-amber-500",
	},
	sent: {
		icon: <CheckCircle2 className="h-4 w-4" />,
		labelKey: "admin.notifications.status.sent",
		badge: "bg-primary/10 text-primary border-primary/20",
		dot: "bg-primary",
	},
	failed: {
		icon: <XCircle className="h-4 w-4" />,
		labelKey: "admin.notifications.status.failed",
		badge: "bg-destructive/10 text-destructive border-destructive/20",
		dot: "bg-destructive",
	},
} as const;

export const channelLabels: Record<string, string> = {
	email: "Email",
	webhook: "Webhook",
};

export function formatDeliveryDate(date: string | Date) {
	return new Intl.DateTimeFormat("fr-FR", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}
