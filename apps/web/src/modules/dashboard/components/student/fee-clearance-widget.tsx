import {
	AlertCircle,
	CheckCircle2,
	ChevronRight,
	CreditCard,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { FeeAssignment } from "../../types";

export function FeeClearanceWidget({
	assignments,
}: {
	assignments: FeeAssignment[];
}) {
	const { t } = useTranslation();
	if (!assignments.length) return null;

	const latest = assignments[0];
	const currency = latest.currency;
	const balance = latest.effectiveAmount - latest.paidAmount;
	const isCleared = latest.status === "paid" || latest.status === "exempt";

	return (
		<div
			className={`flex items-center gap-3 rounded-xl border p-4 shadow-sm ${
				isCleared
					? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
					: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
			}`}
		>
			{isCleared ? (
				<CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
			) : (
				<AlertCircle className="h-8 w-8 shrink-0 text-amber-600" />
			)}
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-foreground text-sm">
					{isCleared
						? t("feeClearance.quitus.cleared")
						: t("feeClearance.quitus.notCleared")}
				</p>
				<p className="text-muted-foreground text-xs">
					{latest.academicYear?.name}
					{!isCleared && (
						<>
							{" · "}
							<span className="font-medium text-amber-700">
								{t("feeClearance.student.balance")} : {balance.toLocaleString()}{" "}
								{currency}
							</span>
						</>
					)}
				</p>
			</div>
			<Button variant="ghost" size="sm" asChild>
				<Link to="/fees">
					<CreditCard className="mr-1 h-4 w-4" />
					{t("student.dashboard.viewFees")}
					<ChevronRight className="ml-1 h-3 w-3" />
				</Link>
			</Button>
		</div>
	);
}
