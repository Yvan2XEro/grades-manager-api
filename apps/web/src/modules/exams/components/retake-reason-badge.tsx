import {
	AlertTriangle,
	Ban,
	CheckCircle,
	type LucideIcon,
	Shield,
	ShieldOff,
	XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { RetakeEligibilityReason } from "../types";

const REASON_CONFIG: Record<
	RetakeEligibilityReason,
	{
		variant: "default" | "secondary" | "destructive" | "outline";
		icon: LucideIcon;
	}
> = {
	NO_GRADE: { variant: "secondary", icon: AlertTriangle },
	FAILED_EXAM: { variant: "destructive", icon: XCircle },
	PASSED_EXAM: { variant: "default", icon: CheckCircle },
	ATTEMPT_LIMIT_REACHED: { variant: "destructive", icon: Ban },
	OVERRIDE_FORCE_ELIGIBLE: { variant: "default", icon: Shield },
	OVERRIDE_FORCE_INELIGIBLE: { variant: "destructive", icon: ShieldOff },
};

/** Why a student is (in)eligible for a retake. */
export function RetakeReasonBadge({
	reason,
}: {
	reason: RetakeEligibilityReason;
}) {
	const { t } = useTranslation();
	const { variant, icon: Icon } = REASON_CONFIG[reason];
	return (
		<Badge variant={variant} className="gap-1 text-xs">
			<Icon className="h-3 w-3" />
			{t(`admin.retake.reasons.${reason}`)}
		</Badge>
	);
}
