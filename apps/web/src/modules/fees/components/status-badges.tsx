import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const assignmentStatusVariants: Record<string, BadgeVariant> = {
	unpaid: "destructive",
	partial: "outline",
	paid: "default",
	exempt: "secondary",
};

const assignmentStatusIcons: Record<string, ReactNode> = {
	paid: <CheckCircle2 className="mr-1 h-3 w-3" />,
	partial: <Clock className="mr-1 h-3 w-3" />,
	unpaid: <XCircle className="mr-1 h-3 w-3" />,
	exempt: <CheckCircle2 className="mr-1 h-3 w-3" />,
};

/** Payment status of a fee assignment (unpaid, partial, paid, exempt). */
export function AssignmentStatusBadge({
	status,
	withIcon = false,
}: {
	status: string;
	withIcon?: boolean;
}) {
	const { t } = useTranslation();
	return (
		<Badge variant={assignmentStatusVariants[status]}>
			{withIcon && assignmentStatusIcons[status]}
			{t(`feeClearance.assignments.status.${status}`)}
		</Badge>
	);
}

const orderStatusVariant = (status: string): BadgeVariant =>
	status === "confirmed"
		? "default"
		: status === "cancelled"
			? "destructive"
			: "outline";

/** Status of a payment order (pending, confirmed, cancelled…). */
export function OrderStatusBadge({ status }: { status: string }) {
	const { t } = useTranslation();
	return (
		<Badge variant={orderStatusVariant(status)}>
			{t(`feeClearance.orders.status.${status}`)}
		</Badge>
	);
}
